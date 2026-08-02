import React from 'react'

function Tarjeta({ children, onClick, style }) {
  return (
    <div className="tarjeta" onClick={onClick} style={style}>
      {children}
    </div>
  )
}

export default Tarjeta
