import axios, { AxiosError, AxiosInstance } from "axios";
import { sleep } from "../utils/sleep.ts";
import { sendTeamsMessage } from "../teams_notifier/SEND-teamsMessage.ts";

type SuccessDataType = {
  status: number;
  statusText: string;
  headers: {
    "set-cookie": string[];
  };
  "odata.metadata": string;
  SessionId: string;
  Version: string;
  SessionTimeOut: number;
};

export type ErrorDataType = {
  response: {
    data: {
      error: {
        message: {
          value: string;
        };
      };
    };
  };
};

const sessionFilePath = "./src/sap-api-wrapper/sap_session.json";

type SessionData = {
  cookie: string;
  expiresAt: number;
};

async function readSessionFromFile(): Promise<SessionData | null> {
  try {
    const data = await Deno.readTextFile(sessionFilePath);
    const session = JSON.parse(data);

    if (session.expiresAt > Date.now()) {
      // console.log("session is still valid for minutes: ", (session.expiresAt - Date.now()) / 60000);
      return session;
    } else {
      console.log("Session has expired");
    }
  } catch (error) {
    console.log("Error getting session", error);
  }
  return null;
}

async function saveSessionToFile(cookie: string, expiresIn: number): Promise<void> {
  const session: SessionData = {
    cookie,
    expiresAt: Date.now() + expiresIn * 60 * 1000, // Expiration time in milliseconds from minutes
  };
  await Deno.writeTextFile(sessionFilePath, JSON.stringify(session));
}


export async function getAuthorizedClient(place: string): Promise<AxiosInstance> {
  // Try to use an existing session
  const storedSession = await readSessionFromFile();
  if (storedSession) {
    return axios.create({
      baseURL: Deno.env.get("SAP_URL"),
      headers: {
        Cookie: storedSession.cookie,
      },
    });
  }

  // No valid session, need to authenticate
  for (let retryCount = 0; retryCount < 3; retryCount++) {
    try {
      const res = await axios<SuccessDataType>({
        method: "post",
        baseURL: Deno.env.get("SAP_URL"),
        url: "Login",
        data: {
          CompanyDB: Deno.env.get("SAP_COMPANY"),
          UserName: Deno.env.get("SAP_USERNAME"),
          Password: Deno.env.get("SAP_PASSWORD"),
        },
      });

      if (res.data && res.headers["set-cookie"]) {
        const cookies = res.headers["set-cookie"]
          ?.map((e) => e.split(";")[0])
          .join("; ");
        if (cookies) {
          // Save the session to a file
          const sessionTimeout = res.data.SessionTimeOut || 30; // Default to 30 minutes if not provided
          await saveSessionToFile(cookies, sessionTimeout);

          // Return a new Axios instance with the cookie
          return axios.create({
            baseURL: Deno.env.get("SAP_URL"),
            headers: {
              Cookie: cookies,
            },
          });
        }
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        await sendTeamsMessage(
          "getAuthorizedClient SAP request failed at " + place,
          `**Error Message**: ${JSON.stringify(error.response?.data)}<BR>
            **Code**: ${error.response?.data.error?.code}<BR>
            **Body**: ${JSON.stringify(error.config)}<BR>
            **Error Message**: ${JSON.stringify(
              error.response?.data.error?.message
            )}<BR>`,
          "summary"
        );
      }
      await sleep(30000); // wait 30 seconds before retrying
    }
  }
  throw new Error("Unable to get authenticated SAP client");
}
