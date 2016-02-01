import '../index.html';
import Cookie from 'js-cookie';
import getCookie from './use-cookie';
import getParams from './use-qs';

Cookie.set('bleep', {bleep: 'bloop'});

const cookie = getCookie('bleep');
const params = getParams();

console.log('Cookie', cookie);
console.log('params', params);

