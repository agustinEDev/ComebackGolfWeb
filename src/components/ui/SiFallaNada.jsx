import { Component } from 'react';
import { registraElFallo } from '../../utils/registraElFallo';

/**
 * Para lo accesorio: si falla (por ejemplo, la descarga de un trozo diferido
 * sin cobertura), no pinta nada y la aplicación sigue. Sin esto el fallo sube
 * hasta el límite de toda la aplicación y tapa la pantalla entera, también la
 * anotación (revisión del aviso de la mudanza, 27 nov 2026).
 */
class SiFallaNada extends Component {
  constructor(props) {
    super(props);
    this.state = { fallo: false };
  }

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  componentDidCatch(error) {
    registraElFallo('SiFallaNada', 'Accesorio que no se pudo pintar:', error);
  }

  render() {
    return this.state.fallo ? null : this.props.children;
  }
}

export default SiFallaNada;
