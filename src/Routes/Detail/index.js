import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { get, map, find, startCase, toLower, chain, pick, filter } from 'lodash';

import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import SlideAnimation from '@material-ui/core/Slide';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { normalizeSymptoms } from '../../Util/format';
import useStyles from './useStyles';

import fetchContact from '../../DAL/fetchContact';
import fetchMemedToken from '../../DAL/fetchMemedToken';
import updateContact from '../../DAL/mutations/contact';
import createPrescription from '../../DAL/mutations/prescription';

import Loader from '../../Components/Loader';
import ElegantError from '../../Components/Error';
import { Treatment as TreatmentList } from '../../Components/RecordList';
import DisplayForm from '../../Components/DisplayForm';
import Symptoms from '../../Components/Symptoms';
import getFields from './fields';

const polite = string => startCase(toLower(string));
const huDistance = string => {
	if (string) {
		const arr = string.toString().split('.');
		const res = [arr[0], arr[1].substring(0, 2)].join(',');
		return `${res}km da localização informada`;
	}
	return '';
};

const Detail = ({ match }) => {
	const classes = useStyles();
	const { t } = useTranslation();
	const [contact, setContact] = useState(null);

	const [loading, setLoading] = useState(true);
	const [current, setCurrent] = useState(null);
	const { rid, uid, config, user } = useSelector(({ app }) => app);

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

		setCurrent({ ...treatment, contact: pick(contact, ['_id', '_updatedAt', 'age', 'isMentalHealthRoom']) });
	};

	// Update state and Konecty data when the fields are saved
	const onFieldsSave = data => updateContact([contact], { ...data, rid });
	const onSuccess = data => setContact({ ...contact, ...data });

	const getColor = category => ({ Vermelha: 'statusRed', Amarela: 'statusYellow', Verde: 'statusGreen' }[category]);

	let { personalFields, healthstatusFields } = getFields({ t, contact });
	const isMentalRoom = get(contact, 'isMentalHealthRoom');
	if (isMentalRoom) {
		const huServices = hu =>
			chain(['hasAssistance', 'hasHospitalization', 'hasTestCollect'])
				.pickBy(v => !!hu[v])
				.map(v => t(v))
				.join(', ')
				.value();

		healthstatusFields = [
			{
				label: t('mental-problems'),
				value: get(contact, 'mentalHealthSymptoms'),
				transformValue: normalizeSymptoms,
			},
			{
				label: t('notes'),
				value: {
					op: find(contact.opportunities, item => item.status === 'Em Andamento') || {},
					desc: get(contact, 'opDescription'),
				},
				transformValue: value => value.desc || get(value, 'op.description'),
			},
			{
				label: t('nearest-health-unit'),
				value: get(contact, 'healthUnits'),
				transformValue: value =>
					[].concat(
						...map(value, hu =>
							filter(
								[hu.type, polite(hu.name), polite(hu.address), huServices(hu), huDistance(hu.distance), ' '],
								i => i !== '',
							),
						),
					),
				readOnly: true,
				dispensable: true,
				breakLine: true,
			},
		];
	}

	const memedAbrirPopUp = (memedToken, memedHost, memedPacienteNome, memedPacienteTelefone) => {
		const memedPopUp = window.open(
			`${window.location.origin}/memed?host=${memedHost}&nome=${memedPacienteNome}&telefone=${memedPacienteTelefone}&token=${memedToken}`,
			'_blank',
			'toolbar=no,status=no,titlebar=no,location=no,menubar=no,resizable=no,width=800,height=600',
		);

		memedPopUp.onMemedScriptLoaded = () => {
			memedPopUp.MdHub.event.add('prescricaoSalva', idPrescricao =>
				createPrescription({ idPrescricao, token: memedToken, rid, uid }),
			);
			memedPopUp.MdHub.event.add('prescricaoExcluida', console.log);
			memedPopUp.MdSinapsePrescricao.event.add('core:moduleInit', function startMemedConfigs(module) {
				if (module.name === 'plataforma.prescricao') {
					memedPopUp.MdHub.command.send('plataforma.prescricao', 'setFeatureToggle', {
						alwaysSendSMS: false,
						deletePatient: true,
						historyPrescription: false,
						newPrescription: true,
						optionsPrescription: true,
						removePatient: false,
						editPatient: true,
						setPatientAllergy: true,
						autocompleteExams: true,
						autocompleteIndustrialized: true,
						autocompleteManipulated: true,
						autocompleteCompositions: true,
						autocompletePeripherals: true,
						copyMedicalRecords: true,
						buttonClose: false,
						newFormula: true,
					});
				}
			});
		};
	};

	const memedPrescricaoClick = async () => {
		const memedPacienteNome = get(personalFields, '0.value') || null;
		const memedPacienteTelefone = get(personalFields, '1.value.0.phoneNumber') || null;

		const memedToken = await fetchMemedToken(uid);
		if (memedToken) {
			const memedHost = config.memedScriptHost;
			memedAbrirPopUp(memedToken, memedHost, memedPacienteNome, memedPacienteTelefone);
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
					{user.data.memedAgent && (
						<Box my={2}>
							<Button
								id="memed-prescricao"
								variant="contained"
								color="primary"
								size="medium"
								onClick={memedPrescricaoClick}
								disableElevation
								disableFocusRipple
							>
								{t('prescricao')}
							</Button>
						</Box>
					)}
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
								// eslint-disable-next-line react/jsx-wrap-multilines
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
