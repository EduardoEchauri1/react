import React, { useState } from 'react';
import { Card, Input, Button, Icon, FlexBox } from '@ui5/webcomponents-react';

import '@ui5/webcomponents-icons/dist/person-placeholder.js';
import '@ui5/webcomponents-icons/dist/locked.js';
import '@ui5/webcomponents-icons/dist/show.js';
import '@ui5/webcomponents-icons/dist/hide.js';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = (e) => {
        // Prevenimos el comportamiento por defecto si es un evento de formulario
        e.preventDefault();

        if (username.trim() !== '') {
            sessionStorage.setItem('LoggedUser', username);
            window.location.href = '/';
        }
    };

    const containerStyle = {
        minHeight: '100vh',
        backgroundColor: 'var(--sapShell_Background)', 
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxSizing: 'border-box',
    };

    const cardStyle = {
        width: '90%',
        maxWidth: '400px',
        boxShadow: 'var(--sapContent_Shadow2)',
        borderRadius: 'var(--sapCard_BorderRadius)',
    }; 

    const formStyle = {
        padding: '1rem 2rem 2rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    };

    return (
        <div style={containerStyle}>
            <Card style={cardStyle}> 
                <FlexBox justifyContent="Center" style={{ padding: '2rem 1rem 1rem 1rem' }}>
                    <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/SAP_2011_logo.svg/2560px-SAP_2011_logo.svg.png" 
                        alt="SAP Logo" 
                        style={{ width: '200px' }}
                    />
                </FlexBox>
                <form style={formStyle} onSubmit={handleLogin}> 
                    <Input
                        icon={<Icon name="person-placeholder" style={{ color: 'var(--sapContent_NonInteractiveIconColor)' }} />}
                        value={username}
                        onInput={(e) => setUsername(e.target.value)}
                        placeholder="Correo"
                        required
                        style={{ width: '100%' }}
                    />

                    <FlexBox style={{ gap: '0.25rem' }}>
                        <Input
                            icon={<Icon name="locked" style={{ color: 'var(--sapContent_NonInteractiveIconColor)' }} />}
                            value={password}
                            onInput={(e) => setPassword(e.target.value)}
                            placeholder="Contraseña"
                            type={showPassword ? "Text" : "Password"}
                            required
                            style={{ width: '100%' }}
                        />
                        <Button
                            icon={showPassword ? "hide" : "show"}
                            design="Transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            tooltip={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        />
                    </FlexBox>

                    <Button 
                        design="Emphasized" 
                        type="Submit" 
                        style={{ 
                            width: '100%',
                            marginTop: '1rem'
                        }}
                    >
                        Iniciar Sesión
                    </Button>
                </form>
            </Card>
        </div>
    );
}

export default LoginPage;
