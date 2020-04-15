import React, { useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';

import Loader from '../../Components/Loader';
import fetchVisitor from '../../DAL/fetchVisitor';

const ClientByToken = ({ location }) => {
	const [to, setTo] = useState(null);

	const search = new URLSearchParams(location.search);
	const params = ['uid', 'rid', 't'].reduce((acc, cur) => ({ ...acc, [cur]: search.get(cur) }), {});
	const parentUrl = document.location.ancestorOrigins && document.location.ancestorOrigins[0];

	if (!params.uid || !parentUrl) {
		return <Redirect to="/" />;
	}

	const loadVisitor = async () => {
		const visitor = await fetchVisitor({ ...params, parentUrl });
		const { code } = visitor;

		if (code) {
			setTo(`/detail/${code}`);
		} else {
			setTo('/');
		}
	};

	useEffect(() => {
		loadVisitor();
	}, []);

	if (to) {
		return <Redirect to={`${to}${location.search}`} />;
	}

	return <Loader />;
};

export default ClientByToken;
