// Helper function to get message className
const getMessageClassName = (type) => {
  if (type === 'success')
    return 'bg-exito-suave text-exito border border-exito';
  if (type === 'error') return 'bg-error-suave text-error border border-error';
  return 'bg-aviso-suave text-aviso border border-aviso';
};

/**
 * El aviso general del formulario, arriba del todo. `ref` es el aviso: el
 * botón vive abajo y en un teléfono se pulsa «Crear» sin ver qué pasó, así que
 * se trae a la vista y recibe el foco (FE #731).
 */
const AvisoDelFormulario = ({ ref, message }) => (
  <div
    ref={ref}
    role={message.type === 'error' ? 'alert' : 'status'}
    tabIndex={-1}
    // Recibe el foco al fallar: con un anillo que se vea (CodeRabbit)
    className={`mx-4 mb-4 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-fondo ${message.type === 'error' ? 'focus:ring-error' : 'focus:ring-tinta'} ${getMessageClassName(message.type)}`}
  >
    {message.text}
  </div>
);

export default AvisoDelFormulario;
