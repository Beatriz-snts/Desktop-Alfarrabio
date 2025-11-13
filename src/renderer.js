import './index.css';
import ServicosView from './Views/ServicosView.js';
import UsuariosView from './Views/UsuariosView.js';
const servicosView = new ServicosView();
const usuariosView = new UsuariosView();
const rotas = {
  '/servicos': servicosView,
  '/usuarios': usuariosView,
};
function navegarPara(rota){
  console.log(rota)
  //                                    2º envia a url = hash
  document.querySelector('#app').innerHTML = rotas[rota].renderizar();
}

window.addEventListener('hashchange', () => {
  const rota = window.location.hash.replace('#', '/');
  navegarPara(rota);
});
//1º envia a url = hash
navegarPara('/servicos');
