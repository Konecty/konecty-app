import { takeLatest, put } from 'redux-saga/effects';
import { queryCache } from 'react-query';
import { LOAD_CONFIG, LOAD_USER } from './constants';

import fetchConfig from '../DAL/fetchConfig';
import { userLoaded, configLoaded } from './actions';
import loadUserInfo from '../DAL/loadUserInfo';

function* loadConfig() {
	const data = yield queryCache.prefetchQuery('config', fetchConfig);
	yield put(configLoaded(data));
}

function* loadUser() {
	const payload = yield queryCache.prefetchQuery('userInfo', loadUserInfo);
	if (payload != null) {
		yield put(userLoaded({ logged: true, data: payload.user }));
	} else {
		yield put(userLoaded({ logged: false }));
	}
}

export default function* () {
	yield takeLatest(LOAD_CONFIG, loadConfig);
	yield takeLatest(LOAD_USER, loadUser);
}
