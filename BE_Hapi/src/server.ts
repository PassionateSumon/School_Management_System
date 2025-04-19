import Hapi from "@hapi/hapi";
import dotenv from "dotenv";
import Jwt from "@hapi/jwt";
import Cookie from "@hapi/cookie";
import jwt from "jsonwebtoken";
import { registerSwagger } from "./plugins/swagger.plugin";
import { ApiError } from "./utils/ApiError.util";
import { User } from "./models/User.model";
import { connectDB } from "./db/db";
import authRoutes from "./routes/auth/auth.route";
import permissionRoutes from "./routes/permission/permission.route";
dotenv.config();

const verifyToken = (token: string, secret: string) => {
  try {
    return jwt.verify(token, secret) as { userId: string };
  } catch (err) {
    throw new ApiError("Invalid or expired token", 401);
  }
};

const validateAccess = async (req: Hapi.Request, token: string) => {
  try {
    // console.log("24 - token -- ", token);
    if (!token) {
      throw new ApiError("No accessToken found in Cookie!", 401);
    }
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    // console.log("29 - secret -- ", accessSecret);
    if (!accessSecret) {
      throw new ApiError("Access Secret is not found in environment!", 401);
    }

    const decoded = verifyToken(token, accessSecret);
    // console.log("34 - decoded -- ", decoded);

    const user = await User.findOne({
      where: { id: decoded?.userId },
    });
    if (!user) {
      throw new ApiError("User not found!", 401);
    }

    return {
      isValid: true,
      credentials: { userId: decoded?.userId },
    };
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Internal server error at validate-access!", 500);
  }
};

const validateRefresh = async (req: Hapi.Request) => {
  try {
    const token = req.state.refreshToken; // Manually get refreshToken from cookie
    console.log("59- token:- ", token)
    if (!token) {
      throw new ApiError("No refreshToken found in Cookie!", 401);
    }
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!refreshSecret) {
      throw new ApiError("Refresh Secret is not found in environment!", 401);
    }
    
    const decoded = verifyToken(token, refreshSecret);
    console.log("69- decoded:- ", decoded)

    // *** This should be changed...
    const user = await User.findOne({
      where: { id: decoded?.userId },
    });
    console.log("75 - User - ",user)
    if (user) {
      throw new ApiError("Invalid refresh token!", 401);
    }

    return {
      isValid: true,
      credentials: { userId: decoded.userId },
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Internal server error at validate-refresh!", 500);
  }
};

const ORIGIN = process.env.DEV_ORIGIN || "http://localhost:5173";

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    // host: "localhost",
    host: "0.0.0.0",
    routes: {
      cors: {
        origin: [ORIGIN],
        credentials: true,
        additionalHeaders: [
          "Accept",
          "Authorization",
          "Content-Type",
          "If-None-Match",
        ],
      },
      state: {
        parse: true,
        failAction: "error",
      },
      payload: {
        output: "stream",
        parse: true,
        multipart: true,
        maxBytes: 1024 * 1024 * 10,
      },
    },
  });

  await server.register(Jwt);
  await server.register(Cookie);

  server.auth.strategy("jwt_access", "cookie", {
    cookie: {
      name: "accessToken",
      password:
        process.env.COOKIE_SECRET || "secret_must_be_at_least_32_chars_long",
      isHttpOnly: false,
      ttl: 15 * 60 * 1000,
      path: "/",
    },
    validate: validateAccess,
  });

  // Define custom scheme for refresh token
  server.auth.scheme("custom-refresh", () => {
    return {
      authenticate: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
        const result = await validateRefresh(request);
        if (!result.isValid) {
          throw new ApiError("Refresh token validation failed", 401);
        }
        return h.authenticated({ credentials: result.credentials });
      },
    };
  });

  // Register refresh token strategy using the custom scheme
  server.auth.strategy("jwt_refresh", "custom-refresh");

  // default strategy
  server.auth.default("jwt_access");

  // swagger register
  await registerSwagger(server);

  // All routes
  server.route(authRoutes);
  server.route(permissionRoutes);

  server.events.on("response", function (req) {
    console.log(
      `${req.info.remoteAddress}: ${req.method.toUpperCase()} ${req.path} --> ${
        (req.response as any).statusCode
      }`
    );
  });

  // My approach is to connect db first and then if all are ok then start the server...
  // So later I have to put db here...
  connectDB().then(async () => {
    await server.start();
    console.log(`Server is running on ${server.info.uri}`);
    console.log(
      `Swagger is running on http://localhost:${process.env.PORT}/documentation`
    );
  });
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
