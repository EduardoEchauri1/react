import React, { useState } from "react";
import { notification } from "antd"; // Mantenemos antd para las notificaciones por simplicidad
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import {
  FlexBox,
  Input,
  Button,
  InputType,
  BusyIndicator,
  Card,
  CardHeader,
  Icon,
  Title,
} from "@ui5/webcomponents-react";
import "@ui5/webcomponents/dist/Assets.js";
import "@ui5/webcomponents-fiori/dist/Assets.js";
import "@ui5/webcomponents-icons/dist/show.js";
import "@ui5/webcomponents-icons/dist/hide.js";
import "@ui5/webcomponents-icons/dist/product.js";

const Login = ({ setIsAuthenticated, setUserRole }) => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Handle form submission
  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.post("/auth/login", {
        username,
        password,
      });

      if (response.status === 200) {
        const { token, user } = response.data;

        if (!token || !user?.role) {
          throw new Error("Respuesta inválida del servidor");
        }

        localStorage.setItem("token", token);
        localStorage.setItem("userRole", user.role);

        setUserRole(user.role);
        setIsAuthenticated(true);

        notification.success({
          message: "Inicio de Sesión Exitoso",
          description: "Has iniciado sesión correctamente.",
          placement: "bottomRight",
        });

        // Redirigir después de una pequeña pausa para asegurar el estado
        setTimeout(() => {
          navigate(user.role === "admin" ? "/admin" : "/home");
        }, 100);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Ocurrió un error al iniciar sesión";

      notification.error({
        message: "Error de Inicio de Sesión",
        description: errorMessage,
        placement: "bottomRight",
      });
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: "100vh",
    backgroundColor: "var(--sapShell_Background)",
    padding: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxSizing: "border-box",
  };

  const cardStyle = {
    width: "90%",
    maxWidth: "450px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    borderRadius: "var(--sapCard_BorderRadius)",
  };

  const formStyle = {
    padding: "2rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  };

  return (
    <div style={containerStyle}>
      <Card
        style={cardStyle}
        header={
          <CardHeader
            avatar={
              <Icon
                name="product"
                style={{
                  fontSize: "2rem",
                  color: "var(--sapBrandColor)",
                }}
              />
            }
            titleText="Product Management Suite"
            subtitleText="Acceso al Sistema"
          />
        }
      >
        <div style={formStyle}>
          <Title level="H3" style={{ textAlign: "center" }}>
            BienvenidoOOOOOOO
          </Title>
          <Input
            placeholder="Nombre de usuario"
            value={username}
            onInput={(e) => setUsername(e.target.value)}
            style={{ width: "100%" }}
          />
          <Input
            placeholder="Contraseña"
            value={password}
            onInput={(e) => setPassword(e.target.value)}
            type={showPassword ? InputType.Text : InputType.Password}
            style={{ width: "100%" }}
            icon={
              <Button
                icon={showPassword ? "hide" : "show"}
                design="Transparent"
                onClick={() => setShowPassword(!showPassword)}
                tooltip="Mostrar/Ocultar contraseña"
              />
            }
          />
          {loading ? (
            <BusyIndicator active style={{ alignSelf: "center" }} />
          ) : (
            <Button
              design="Emphasized"
              onClick={handleLogin}
              disabled={loading}
              style={{ width: "100%", marginTop: "1rem" }}
            >
              Iniciar Sesión
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Login;
        />

        <Input
          placeholder="Correo"
          value={username}
          onInput={(e) => setUsername(e.target.value)}
          style={{ width: "300px", marginBottom: "1rem" }}
        />

        <FlexBox style={{ width: "300px", marginBottom: "1rem" }}>
          <Input
            placeholder="Contraseña"
            value={password}
            onInput={(e) => setPassword(e.target.value)}
            type={showPassword ? InputType.Text : InputType.Password}
            style={{ width: "100%" }}
          />
          <Button
            icon={showPassword ? "hide" : "show"}
            design="Transparent"
            onClick={() => setShowPassword(!showPassword)}
            tooltip="Mostrar/Ocultar contraseña"
          />
        </FlexBox>

        {loading ? (
          <BusyIndicator active />
        ) : (
          <Button
            onClick={handleLogin}
            disabled={loading}
            style={{ width: "300px" }}
          >
            IniciaSSSSSSSSsr Sesión
          </Button>
        )}
      </FlexBox>
    </FlexBox>
  );
};

export default Login;
