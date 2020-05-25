import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { get, pick, find } from 'lodash';

import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import SlideAnimation from '@material-ui/core/Slide';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import useStyles from './useStyles';

import fetchContact from '../../DAL/fetchContact';
import updateContact from '../../DAL/mutations/contact';

import Loader from '../../Components/Loader';
import ElegantError from '../../Components/Error';
import { Treatment as TreatmentList } from '../../Components/RecordList';
import DisplayForm from '../../Components/DisplayForm';
import Symptoms from '../../Components/Symptoms';
import getFields from './fields';

import localforage from 'localforage';
import { queryCache } from 'react-query';

const Detail = ({ match }) => {
	const classes = useStyles();
	const { t } = useTranslation();
	const [contact, setContact] = useState(null);
	const [loading, setLoading] = useState(true);
	const [current, setCurrent] = useState(null);
	const { rid, uid } = useSelector(({ app }) => app);

	const getDetails = async code => {
		try {
			const person = await fetchContact({ code, rid, uid });

			if (person) {
				return person;
			}

			return { code };
		} catch (e) {
			return { code };
		}
	};

	useEffect(() => {
		const routeCode = Number(match.params.code);
		const loaded = contact && contact.code === routeCode;

		if (loaded) setLoading(false);
		else {
			setLoading(true);
			getDetails(routeCode).then(setContact).catch(setContact);
		}
	}, [contact]);

	if (loading) {
		return <Loader />;
	}

	if (!contact._id) {
		return <ElegantError text={t('error-contact-not-found')} fullScreen />;
	}

	const treatment = find(contact.opportunities, item => item.editable === true);

	// Update state when opportunity saved
	const onCloseEdit = updatedFields => {
		setContact(oldData => {
			const newData = Object.assign(oldData, updatedFields);
			const opIdx = oldData.opportunities.findIndex(op => op.code === current.code);

			updatedFields.description = updatedFields.opDescription;
			if (opIdx > -1) newData.opportunities[opIdx] = Object.assign(oldData.opportunities[opIdx], updatedFields);
			else newData.opportunities.unshift(updatedFields);

			newData.opDescription = updatedFields.description;
			return newData;
		});
		setCurrent(null);
	};
	const onEdit = e => {
		e.stopPropagation();
		if (!treatment) return;

		setCurrent({ ...treatment, contact: pick(contact, ['_id', '_updatedAt', 'age']) });
	};

	// Update state and Konecty data when the fields are saved
	const onFieldsSave = data => updateContact([contact], { ...data, rid });
	const onSuccess = data => setContact({ ...contact, ...data });

	const getColor = category => ({ Vermelha: 'statusRed', Amarela: 'statusYellow', Verde: 'statusGreen' }[category]);

	const { personalFields, healthstatusFields } = getFields({ t, contact });

	const memedAbrirPopUp = (appBaseUrl, appToken, memedToken, memedHost, memedPacienteNome) => {
		const memedPopUp = window.open(
			`${window.location.origin}/memed?host=${memedHost}&nome=${memedPacienteNome}&token=${memedToken}`,
			'_blank',
			'toolbar=no,status=no,titlebar=no,location=no,menubar=no,width=800,height=600',
		);

		let memedPrescricoesAdicionadas = [];
		let memdPrescricoesExcluidas = [];

		const memedAdicionarPrescricao = idPrescricao => {
			if (memedPopUp.document.memedPrescricoesAdicionadas !== undefined) {
				let len = memedPopUp.document.memedPrescricoesAdicionadas.length;
				for (let i = 0; i < len; i++) {
					const prescricao = memedPopUp.document.memedPrescricoesAdicionadas[i];
					if (!memedPrescricoesAdicionadas.includes(prescricao)) {
						var memedAdicionarPrescricaoHeaders = new Headers();
						memedAdicionarPrescricaoHeaders.append('Authorization', appToken);
						memedAdicionarPrescricaoHeaders.append('Content-Type', 'application/json');
						var memedAdicionarPrescricaoConfig = {
							method: 'POST',
							headers: memedAdicionarPrescricaoHeaders,
							body: JSON.stringify({ rid: uid, idPrescricao: prescricao }),
						};
						fetch(`${appBaseUrl}/memed/prescricao`, memedAdicionarPrescricaoConfig)
							.then(response => {
								if (response.ok) {
									console.log(`Prescrição ${prescricao} adicionada com sucesso!`);
								} else {
									console.log(`A adição da prescrição ${prescricao} foi rejeitada pelo servidor!`);
								}
							})
							.catch(error => {
								console.log(`Erro ao tentar adicionar a prescrição ${prescricao}: ${error}`);
							});
						memedPrescricoesAdicionadas.push(prescricao);
					}
				}
			}
		};

		const memedExcluirPrescricao = idPrescricao => {
			if (memedPopUp.document.memdPrescricoesExcluidas !== undefined) {
				let len = memedPopUp.document.memdPrescricoesExcluidas.length;
				for (let i = 0; i < len; i++) {
					const prescricao = memedPopUp.document.memdPrescricoesExcluidas[i];
					if (!memdPrescricoesExcluidas.includes(prescricao)) {
						//TODO excluir prescricao
						console.log('Excluir prescrição: ' + prescricao);
						memdPrescricoesExcluidas.push(prescricao);
					}
				}
			}
		};

		const memedPopUpMonitor = setInterval(() => {
			if (memedPopUp.document.readyState === 'complete') {
				memedAdicionarPrescricao();
				memedExcluirPrescricao();
			}
		}, 50);

		memedPopUp.onbeforeunload = () => {
			clearInterval(memedPopUpMonitor);
		};
	};

	const memedPrescricaoClick = async e => {
		//TODO - Refatorar posteriormente. Usar métodos da classe Api.js
		const appConfig = await queryCache.getQueryData('config');
		const appBaseUrl = `${appConfig['konecty-url']}/api/v2`;

		const appToken = await localforage.getItem('token');
		var memedObterTokenHeaders = new Headers();
		memedObterTokenHeaders.append('Authorization', appToken);

		var memedObterTokenFetchConfig = {
			method: 'GET',
			headers: memedObterTokenHeaders,
		};

		const memedPacienteNome = personalFields[0].value;

		if (uid === undefined) {
			//TODO - Retirar tratamento do uid usado para desenvolvimento e testes
			const memedHost = 'sandbox.memed.com.br';
			const memedToken =
				'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.WzMzOTMzLCJlYzQ4ZDZhZTMxNTkyMTlhZjZjZWNmMGE1M2YxNmZkMCIsIjIwMjAtMDUtMTgiLCJzaW5hcHNlLnByZXNjcmljYW8iLCJwYXJ0bmVyLjMuMjkzMTQiXQ.PrWJUSGDgFW2oYJqPir13O-HhsZNAjKC9OuwhMy0mOE';
			memedAbrirPopUp(appBaseUrl, appToken, memedToken, memedHost, memedPacienteNome);
		} else {
			fetch(`${appBaseUrl}/memed/getToken?uid=${uid}`, memedObterTokenFetchConfig)
				.then(response => {
					if (response.ok) {
						const memedHost = 'api.memed.com.br';
						memedAbrirPopUp(appBaseUrl, appToken, response.data.token, memedHost, memedPacienteNome);
					} else {
						console.log('Não foi possível recuperar o token para integração com a Memed');
					}
				})
				.catch(error => {
					console.log(`Não foi possível carregar o módulo de prescrições da Memed devido ao erro: ${error}`);
				});
		}
	};

	return (
		<>
			<div style={{ display: current ? 'none' : 'initial' }}>
				<AppBar position="static">
					<Toolbar style={{ padding: 0 }}>
						<Container maxWidth="sm">
							<Box display="flex" justifyContent="space-between" width={1}>
								<Typography variant="subtitle1" component="h1" className={classes.title}>
									{get(contact, 'name.full', '').trim()}
								</Typography>
							</Box>
						</Container>
					</Toolbar>
				</AppBar>
				<Box py={1} bgcolor={`${getColor(contact.category)}.main`} color={`${getColor(contact.category)}.contrastText`}>
					<Container maxWidth="sm">
						<Typography variant="subtitle2">
							{t('classification')}: {t(contact.category)}
						</Typography>
					</Container>
				</Box>
				{contact.registerExpired && (
					<Box bgcolor="grey.300" py={1}>
						<Container maxWidth="sm">
							<Typography variant="subtitle2">{t('registration-time-expired')}</Typography>
						</Container>
					</Box>
				)}
				<Container maxWidth="sm" className={classes.root}>
					<Box my={2}>
						<Button
							id="memed-prescricao"
							variant="contained"
							color="primary"
							size="medium"
							onClick={memedPrescricaoClick}
							disabled={!treatment}
							disableElevation
							disableFocusRipple
						>
							{t('prescricao')}
						</Button>
					</Box>
					<Box my={2}>
						<DisplayForm
							title={t('personal-data')}
							fields={personalFields}
							onSave={onFieldsSave}
							onSuccess={onSuccess}
							editable
						/>
						<DisplayForm
							title={t('health-status')}
							fields={healthstatusFields}
							button={
								<Button
									variant="contained"
									size="small"
									onClick={onEdit}
									disabled={!treatment}
									disableElevation
									disableFocusRipple
								>
									{t('edit')}
								</Button>
							}
						/>
					</Box>

					<Box my={2}>
						<Typography variant="h5" component="h2" className={classes.title}>
							{t('opportunities')}
						</Typography>
						<TreatmentList items={contact.opportunities} onEdit={onEdit} />
					</Box>
				</Container>
			</div>
			<SlideAnimation in={!!current} direction="down" mountOnEnter unmountOnExit>
				<Box bgcolor="#fff">
					<Symptoms data={current} save={onCloseEdit} cancel={() => setCurrent(null)} />
				</Box>
			</SlideAnimation>
		</>
	);
};

if (process.env.__DEV__) {
	Detail.displayName = 'DetailView';

	Detail.propTypes = {
		match: PropTypes.shape({
			params: PropTypes.shape({
				code: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
			}),
		}),
	};
}

export default Detail;
