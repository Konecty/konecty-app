import axios from 'axios';
import localforage from 'localforage';
import { queryCache } from 'react-query';

export const get = async (...args) => {
	const token = await localforage.getItem('token');
	const config = await queryCache.getQueryData('config');
	if (config != null) {
		const axiosInstance = axios.create({
			baseURL: config['konecty-url'],
			headers: {
				Authorization: token,
			},
		});
		return axiosInstance.get(...args);
	}
	return null;
};

export const post = async (...args) => {
	const token = await localforage.getItem('token');
	const config = await queryCache.getQueryData('config');
	if (config != null) {
		const axiosInstance = axios.create({
			baseURL: config['konecty-url'],
			headers: {
				Authorization: token,
			},
		});
		return axiosInstance.post(...args);
	}
	return null;
};

export const postRed = async (...args) => {
	const token = await localforage.getItem('token');
	const config = await queryCache.getQueryData('config');
	if (config != null) {
		const axiosInstance = axios.create({
			baseURL: `${config['konecty-url']}/api/v2`,
			headers: {
				Authorization: token,
			},
		});
		return axiosInstance.post(...args);
	}
	return null;
};

export const put = async (...args) => {
	const token = await localforage.getItem('token');
	const config = await queryCache.getQueryData('config');
	if (config != null) {
		const axiosInstance = axios.create({
			baseURL: config['konecty-url'],
			headers: {
				Authorization: token,
			},
		});
		return axiosInstance.put(...args);
	}
	return null;
};

export const putRed = async (...args) => {
	const token = await localforage.getItem('token');
	const config = await queryCache.getQueryData('config');
	if (config != null) {
		const axiosInstance = axios.create({
			baseURL: `${config['konecty-url']}/api/v2`,
			headers: {
				Authorization: token,
			},
		});
		return axiosInstance.put(...args);
	}
	return null;
};
