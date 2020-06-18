import React, { useContext } from 'react';
import AsyncStorage from '@react-native-community/async-storage';

export const SessionContext = React.createContext({});

const initialState = {
  token: null,
  isLoading: true,
}

function sleep(ms : number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const submitSigninRequest = async (username : string, password : string) => {
  await sleep(2000);
  return 'abcdefg';
}

const sessionReducer = (state, action) => {
  switch(action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...state,
        token: action.payload.token,
        isLoading: false,
      }

    case 'LOG_IN_SUBMIT':
      return { 
        ...state,
        token: null,
        isLoading: true,
      };

    case 'LOG_IN_SUCCESS':
      return { 
        ...state,
        token: action.payload.token,
        isLoading: false,
      };

    case 'LOG_OUT':
      return { 
        ...state,
        token: null,
        isLoading: false,
      };

    default:
      throw new Error();
  }
}

export const SessionProvider = ({ children }) => { 
  const [state, dispatch] = React.useReducer(sessionReducer, initialState);

  const contextValue = React.useMemo(() => {
    const actions = {
      logIn: async (username : string, password : string) => {
        dispatch({ type: 'LOG_IN_SUBMIT' });

        const token = await submitSigninRequest(username, password);
        await AsyncStorage.setItem('sessionToken', token);

        dispatch({ type: 'LOG_IN_SUCCESS', payload: { token }});
      },
      logOut: async () => {
        dispatch({ type: 'LOG_OUT'});
      }
    }

    return [state, actions];
  }, [state, dispatch]);

  React.useEffect(() => {
    const bootstrap = async () => {
      let token;

      token = await AsyncStorage.getItem('sessionToken');

      dispatch({ type: 'RESTORE_TOKEN', payload: { token }})
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