import Cookie from 'js-cookie';

export default function(name) {
  return Cookie.get(name);
}
