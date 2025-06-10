import React from 'react';
import PropTypes from 'prop-types';
import styles from './PersonalProfile.module.css'; // 1. Importar el archivo CSS Modules

// Helper function to safely get string values
const getString = (field) => {
  if (field === null || typeof field === 'undefined') return 'N/A';
  if (typeof field === 'string') return field;
  if (typeof field === 'object' && field.name && typeof field.name === 'string') return field.name;
  if (typeof field === 'object') return 'N/A'; // Avoid [object Object]
  return String(field);
};

const PersonalProfile = ({ user, onEditProfile, onChangePassword, isLoading }) => {
  if (!user) {
    return null; // Or a loading skeleton
  }

  const avatarNameParam = encodeURIComponent(getString(user.nombreCompleto) || getString(user.username));
  const avatarBgColor = 'E9C46A'; // Hex without '#'
  const avatarTextColor = '4A4A4A';  // Hex without '#'
  const avatarFallbackUrl = `https://ui-avatars.com/api/?name=${avatarNameParam}&background=${avatarBgColor}&color=${avatarTextColor}&size=150&font-size=0.33&bold=true`;

  return (
    // 2. Usar className en lugar de style, referenciando los estilos del objeto 'styles' importado
    <div className={styles.profileDisplayCard}>
      <div className={styles.decorativeCircleOne}></div>
      <div className={styles.decorativeCircleTwo}></div>

      <div className={styles.contentForeground}>
        {/* Header Section */}
        <div className={styles.headerSection}>
          <h1 className={styles.nameText}>
            {getString(user.nombreCompleto) || getString(user.username)}
          </h1>
          <div className={styles.titleSeparatorLine}></div>
        </div>

        {/* Main Content: Avatar + Info Grid */}
        <div className={styles.mainContentWrapper}>
          <div className={styles.avatarContainer}>
            <img
              src={user.avatarUrl || avatarFallbackUrl}
              alt={`Avatar de ${getString(user.nombreCompleto)}`}
              className={styles.avatarImage} // Usar className
              onError={(e) => {
                e.target.onerror = null; // Prevent infinite loop if fallback also fails
                e.target.src = avatarFallbackUrl;
              }}
            />
          </div>

          <div className={styles.informationGrid}>
            <div className={styles.infoEntry}>
              <span className={styles.infoLabel}>Email</span>
              <p className={styles.infoValue}>{getString(user.email)}</p>
            </div>
            <div className={styles.infoEntry}>
              <span className={styles.infoLabel}>Celular</span>
              <p className={styles.infoValue}>{getString(user.celular)}</p>
            </div>
            <div className={styles.infoEntry}>
              <span className={styles.infoLabel}>Documento</span>
              <p className={styles.infoValue}>{getString(user.documento)}</p>
            </div>
            <div className={styles.infoEntry}>
              <span className={styles.infoLabel}>Nombre de Usuario</span>
              <p className={styles.infoValue}>{getString(user.username)}</p>
            </div>
            <div className={styles.infoEntry}>
              <span className={styles.infoLabel}>Rol</span>
              <p className={styles.infoValue}>{getString(user.role)}</p>
            </div>
            {/* Add more fields here if needed, following the pattern */}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionsContainer}>
          <button
            // 3. Combinar clases para estilos condicionales
            className={`${styles.actionButton} ${isLoading ? styles.buttonDisabled : ''}`}
            onClick={onEditProfile}
            disabled={isLoading}
            title="Editar la información de tu perfil"
          >
            Editar Perfil
          </button>
          <button
            className={`${styles.actionButton} ${isLoading ? styles.buttonDisabled : ''}`}
            onClick={onChangePassword}
            disabled={isLoading}
            title="Cambiar tu contraseña"
          >
            Cambiar Contraseña
          </button>
        </div>
      </div> {/* End contentForeground */}
    </div> // End profileDisplayCard
  );
};

PersonalProfile.propTypes = {
  user: PropTypes.shape({
    nombreCompleto: PropTypes.string,
    email: PropTypes.string,
    celular: PropTypes.string,
    documento: PropTypes.string,
    username: PropTypes.string,
    role: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({ name: PropTypes.string })
    ]),
    avatarUrl: PropTypes.string,
  }),
  onEditProfile: PropTypes.func.isRequired,
  onChangePassword: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default PersonalProfile;