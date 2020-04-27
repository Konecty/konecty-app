import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
	title: {
		marginBottom: theme.spacing(2),
	},
	button: {
		boxShadow: 'none',
		marginLeft: '5px',
	},
	cancelButton: {
		backgroundColor: theme.palette.grey[300],
		padding: '3px',
		borderRadius: '3px',
	},
	textFieldRoot: {
		width: '100%',
	},
	inputControl: {
		marginTop: '8px!important',
		paddingLeft: 128,
		paddingTop: 2,
		paddingBottom: 8,
		// textAlign: 'right',
	},
	inputControlReadOnly: {
		marginTop: '8px!important',
		paddingLeft: 128,
		paddingTop: 2,
		paddingBottom: 8,
		borderBottom: 'none',
		// textAlign: 'right',
		'&:before': {
			borderBottom: '1px solid rgba(0, 0, 0, 0.1)!important',
		},
		'&:after': {
			display: 'none!important',
		},
	},
	select: {
		paddingTop: 11,
		paddingLeft: 128,
		paddingBottom: 11,
		marginTop: -14,
		marginBottom: 4,
	},
	selectIcon: {
		top: 'calc(50% - 20px)',
	},
	input: {
		// textAlign: 'right',
	},
	inputMultiline: {
		paddingBottom: 9,
	},
	label: {
		width: 126,
		fontSize: '0.875rem',
		transform: 'translate(0, 16px) scale(1)',
		textOverflow: 'ellipsis',
		overflow: 'hidden',
		whiteSpace: 'nowrap',
	},
	labelReadOnly: {
		width: 126,
		fontSize: '0.875rem',
		transform: 'translate(0, 16px) scale(1)',
		textOverflow: 'ellipsis',
		overflow: 'hidden',
		whiteSpace: 'nowrap',
		color: 'rgba(0, 0, 0, 0.54)!important',
	},
}));

export default useStyles;
