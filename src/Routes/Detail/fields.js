import { get, map } from 'lodash';
import { set } from 'immutable';

export default ({ t, contact }) => {
	const personalFields = [
		{
			label: t('phone'),
			value: get(contact, 'phone'),
			transformValue: v => map(v, phone => phone.phoneNumber),
			onSave: (data, value) =>
				set(
					data,
					'phone',
					value.split('\n').map(e => ({ phoneNumber: e, countryCode: get(contact, 'phone.0.countryCode', 55) })),
				),
		},
		{
			label: t('gender'),
			value: get(contact, 'gender'),
			opts: ['Masculino', 'Feminino', 'Não se Aplica'],
			onSave: (data, value) => set(data, 'gender', value),
		},
		{ label: t('age'), value: get(contact, 'age'), onSave: (data, value) => set(data, 'age', value) },
		{ label: 'CPF', value: get(contact, 'CPF'), onSave: (data, value) => set(data, 'CPF', value) },
		{ label: t('notes'), value: get(contact, 'notes'), onSave: (data, value) => set(data, 'notes', value) },
	];

	const locationFields = [
		{
			label: t('state'),
			value: get(contact, 'address.0.state'),
			onSave: (data, value) => set(data, 'address', [{ ...get(contact, 'address.0'), ...get(data, 'address.0', {}), state: value }]),
		},
		{
			label: t('city'),
			value: get(contact, 'address.0.city'),
			onSave: (data, value) => set(data, 'address', [{ ...get(contact, 'address.0'), ...get(data, 'address.0', {}), city: value }]),
		},
		{
			label: t('district'),
			value: get(contact, 'address.0.district'),
			onSave: (data, value) => set(data, 'address', [{ ...get(contact, 'address.0'), ...get(data, 'address.0', {}), district: value }]),
		},
	];

	const healthstatusFields = [
		{
			label: t('mild-symptoms'),
			value: get(contact, 'mildSymptoms'),
			onSave: (data, value) => set(data, 'mildSymptoms', value),
		},
		{
			label: t('severe-symptoms'),
			value: get(contact, 'severeSymptoms'),
			onSave: (data, value) => set(data, 'severeSymptoms', value),
		},
		{
			label: t('health-problems'),
			value: get(contact, 'healthProblems'),
			onSave: (data, value) => set(data, 'healthProblems', value),
		},
		{
			label: t('short-of-breath'),
			value: get(contact, 'hasShortnessofBreath'),
			boolean: true,
			onSave: (data, value) => set(data, 'hasShortnessofBreath', value),
		},
		{
			label: t('is-pregnant'),
			value: get(contact, 'isPregnant'),
			boolean: true,
			onSave: (data, value) => set(data, 'isPregnant', value),
		},
		{
			label: t('risk-group'),
			value: get(contact, 'riskGroup'),
			boolean: true,
			onSave: (data, value) => set(data, 'riskGroup', value),
		},
		{
			label: t('symptom-days'),
			value: get(contact, 'symptomDays'),
			onSave: (data, value) => set(data, 'symptomDays', value),
		},
	];

	return { personalFields, locationFields, healthstatusFields };
};
