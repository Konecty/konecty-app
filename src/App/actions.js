import { LOAD_CONFIG, CONFIG_LOADED, LOAD_USER, USER_LOADED } from './constants';

export const loadConfig = () => ({
	type: LOAD_CONFIG,
});

export const configLoaded = payload => ({
	type: CONFIG_LOADED,
	payload,
});

export const loadUser = payload => ({
	type: LOAD_USER,
	payload,
});

export const userLoaded = payload => ({
	type: USER_LOADED,
	payload,
});
