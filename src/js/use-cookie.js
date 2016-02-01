import Cookie from 'js-cookie';

export default function(name) {
  console.log('inside', name);
  return Cookie.get(name);
}
