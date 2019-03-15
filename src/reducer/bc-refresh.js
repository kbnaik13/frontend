import { cookieFetch } from '../lib/utils';

const TOKEN_KEY = 'RaBcRefresh';
const token = cookieFetch(TOKEN_KEY);
const defaultState = token || null;

export default (state = defaultState, { type, payload }) => {
  switch (type) {
    case 'REFRESH_TOKEN_SET_BC':
      return payload;
    case 'REFRESH_TOKEN_REMOVE_BC':
      return null;
    default:
      return state;
  }
};