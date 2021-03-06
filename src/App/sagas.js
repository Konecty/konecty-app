import { takeLatest, put } from 'redux-saga/effects';
import { queryCache } from 'react-query';
import localforage from 'localforage';
import { LOAD_CONFIG, LOAD_USER, PROP_MERGE } from './constants';

import fetchConfig from '../DAL/fetchConfig';
import fetchSymptoms from '../DAL/fetchSymptoms';
import { userLoaded, configLoaded } from './actions';
import loadUserInfo from '../DAL/loadUserInfo';
import { decrypt } from '../Util/crypto';

function* loadConfig({ payload }) {
	const data = yield queryCache.prefetchQuery('config', [payload], fetchConfig);
	yield put(configLoaded(data));
}

function* loadUser({ payload }) {
	if (payload && payload.encrypted) {
		payload.token = yield decrypt(payload.token, payload.jwk);

		localforage.setItem('token', payload.token);
	}

	const res = yield loadUserInfo(payload);

	if (res != null) {
		yield put(userLoaded({ logged: true, data: res.user }));
		const symptoms = yield queryCache.prefetchQuery('symptoms', fetchSymptoms);
		yield put({ type: PROP_MERGE, payload: { config: { symptoms } } });
	} else {
		yield put(userLoaded({ logged: false }));
	}
}

export default function* () {
	yield takeLatest(LOAD_CONFIG, loadConfig);
	yield takeLatest(LOAD_USER, loadUser);
}
