import React from 'react';
import { SafeAreaView, View } from 'react-native';
import { Button, Text, Divider, Layout, TopNavigation, Spinner, Icon } from '@ui-kitten/components';
import { useSession } from './Session';

interface LoadingButtonProps {
  loading : boolean
  iconName : string

}

const LoadingButton = ({ loading, iconName, ...props }) => {
  const LoadingIcon = (props) => (
    loading ? 
      <Spinner size='small'/> : 
      <Icon name={iconName} {...props} ></Icon>
  );

  return (
  <Button disabled={loading} accessoryLeft={LoadingIcon} {...props} />
  )
};

export const HomeScreen = ({ navigation }) => {
  const [session, actions] = useSession();

  const logIn = () => {
    actions.logIn('abcde');
  };

  const logOut = () => {
    actions.logOut();
  };

  const navigateDetails = () => {
    navigation.navigate('Details');
  };

  const UnauthenticatedView = () => (
    <View>
      <Text>{session.errorMessage}</Text>
      <LoadingButton loading={session.isLoading} iconName='log-in-outline' onPress={(logIn)}>Log In</LoadingButton>
    </View>
  )

  const AuthenticatedView = () => (
    <View>
      <Text category='h5'>Hi {session.user.given_name}!</Text>
      <Button onPress={navigateDetails}>Show Details</Button>
      <LoadingButton loading={session.isLoading} iconName='log-out-outline' onPress={logOut}>Log Out</LoadingButton>
    </View>
  )

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopNavigation title='MyApp' alignment='center'/>
      <Divider/>
      <Layout style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        { session.user ? <AuthenticatedView /> : <UnauthenticatedView /> }
      </Layout>
    </SafeAreaView>
  );
};