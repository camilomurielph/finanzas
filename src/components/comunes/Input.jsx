import React from 'react'

function Input({ value, onChange, placeholder, type = 'text', style, className = '', ...props }) {
  return (
    <input
      type={type}
      className={`input ${className}`}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={style}
      {...props}
    />
  )
}

export default Input
