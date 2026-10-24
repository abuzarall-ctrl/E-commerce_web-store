// Reusable auth field: label + icon input + optional suffix (e.g. show/hide password).
export default function AuthInput({
  label,
  labelRight,
  id,
  icon: Icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  onKeyDown,
  suffix,
  name,
  autoComplete,
  error,
  inputMode,
  maxLength,
}) {
  return (
    <div>
      {(label || labelRight) && (
        <div className="auth-label-row">
          {label ? (
            <label className="auth-label" htmlFor={id}>{label}</label>
          ) : <span />}
          {labelRight}
        </div>
      )}
      <div className="auth-input-wrap">
        {Icon && (
          <Icon size={15} className="auth-input-icon" />
        )}
        <input
          id={id}
          className={`auth-input${Icon ? '' : ' auth-input--no-icon'}`}
          type={type}
          name={name}
          autoComplete={autoComplete}
          aria-label={label}
          aria-invalid={error ? 'true' : undefined}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          inputMode={inputMode}
          maxLength={maxLength}
        />
        {suffix}
      </div>
    </div>
  )
}