import React from 'react'

function Boton({ children, onClick, className = '', style }) {
  return (
    <button className={`boton ${className}`} onClick={onClick} style={style}>
      {children}
    </button>
  )
}

export default Boton
