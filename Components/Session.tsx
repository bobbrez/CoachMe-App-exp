import React, { useContext } from 'react';
import AsyncStorage from '@react-native-community/async-storage';
import jwtDecode from 'jwt-decode';
import Auth0 from 'react-native-auth0';
import Config from "react-native-config";

export const SessionContext = React.createContext({});

const auth0 = new Auth0({
  domain: Config.AUTH0_DOMAIN, 
  clientId: Config.AUTH0_CLIENTID,
});

const scope = 'openid profile email offline_access';

const initialState = {
  user: null,
  errorMessage: null,
  isLoading: true,
}

const sessionReducer = (state, action) => {
  switch(action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...state,
        user: action.payload.user,
        isLoading: false,
      }

    case 'LOG_IN_SUBMIT':
      return { 
        ...state,
        user: null,
        isLoading: true,
      };

    case 'LOG_IN_SUCCESS':
      return { 
        ...state,
        user: action.payload.user,
        isLoading: false,
      };

    case 'LOG_IN_FAILURE':
      return {
        ...state,
        errorMessage: action.payload.errorMessage,
        user: null,
        isLoading: false,
      }

    case 'LOG_OUT':
      return { 
        ...state,
        user: null,
        isLoading: false,
      };

    case 'LOG_OUT_FAILURE':
      return {
        ...state,
        errorMessage: action.payload.errorMessage,
        isLoading: false,
      }

    default:
      throw new Error();
  }
}

const decodeUserFromSession = (session) => jwtDecode(session.idToken);

const updateStoredSession = async (session) => {
  const user = jwtDecode(session.idToken);
  const sessionJson = JSON.stringify(session)
  await AsyncStorage.setItem('session', sessionJson);
}

export const SessionProvider = ({ children }) => { 
  const [state, dispatch] = React.useReducer(sessionReducer, initialState);

  const contextValue = React.useMemo(() => {
    const actions = {
      logIn: async (username : string, password : string) => {
        dispatch({ type: 'LOG_IN_SUBMIT' });

        try {
          const session = await auth0.webAuth.authorize({ scope });
          
          await updateStoredSession(session);
          
          const user = decodeUserFromSession(session);

          dispatch({ type: 'LOG_IN_SUCCESS', payload: { user }});
        } catch(e) {
          // Only ignore user_canceled errors
          const errorMessage = e.error === 'a0.session.user_cancelled' ? null : e.error_description
          dispatch({ type: 'LOG_IN_FAILURE', payload: { errorMessage }});
        }
      },

      logOut: async () => {
        try {
          await auth0.webAuth.clearSession({});
          await AsyncStorage.clear();

          dispatch({ type: 'LOG_OUT'});
        } catch(e) {
          // Only ignore user_canceled errors
          const errorMessage = e.error === 'a0.session.user_cancelled' ? null : e.error_description
          dispatch({ type: 'LOG_OUT_FAILURE', payload: { errorMessage }});
        }
      }
    }

    return [state, actions];
  }, [state, dispatch]);

  React.useEffect(() => {
    const bootstrap = async () => {
      let user;

      try {
        const sessionJson = await AsyncStorage.getItem('session');
        const session = JSON.parse(sessionJson || '{}');

        user = decodeUserFromSession(session);

        try {
          const validUser = await auth0.auth.userInfo({ token: session.accessToken });
        } catch(e) {
          if (e.name == 'a0.response.invalid' && e.message === 'invalid_token') {
            const newSession = await auth0.auth.refreshToken({ refreshToken: session.refreshToken, scope })

            user = await updateStoredSession(newSession);
          } else {
            throw e;
          }
        }

      } catch(e) {
        user = null
        await AsyncStorage.clear();
      }

      dispatch({ type: 'RESTORE_TOKEN', payload: { user }})
    }

    bootstrap();
  }, [])

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession: () => any = () => useContext(SessionContext);