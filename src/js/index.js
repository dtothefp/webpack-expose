/*eslint-disable*/
import '../index.html';
import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import Cookie from 'js-cookie';
import getCookie from './use-cookie';
import getParams from './use-qs';

Cookie.set('bleep', {bleep: 'bloop'});

const cookie = getCookie('bleep');
const params = getParams();

console.log('Cookie', cookie);
console.log('params', params);

const Dope = ({children}) => {
  return (
    <div>
      <h1>This is lame</h1>
      {children}
    </div>
  );
};

const Hi = ({name}) => <h3>Hellooooo {name}</h3>;

const comp = (
  <Dope>
    <Hi name="Peaches" />
  </Dope>
);

ReactDOM.render(
  comp,
  document.querySelector('[data-react]')
);
