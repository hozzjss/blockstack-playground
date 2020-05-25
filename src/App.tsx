import React, { Component } from "react";
import Profile from "./Profile";
import SignIn from "./Signin";
import { UserSession, AppConfig } from "blockstack";
import { Connect, AuthOptions } from "@blockstack/connect";
import { UserData } from "blockstack/lib/auth/authApp";

const appConfig = new AppConfig();
const userSession = new UserSession({ appConfig: appConfig });

interface IState {
  userData: null | UserData;
}

const App: React.FC = () => {
  const [userData, setUserData] = React.useState<UserData | null>(null);

  const handleSignOut = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setUserData(null);
    userSession.signUserOut(window.location.origin);
  };

  React.useEffect(() => {
    if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn().then((res) => {
        window.history.replaceState({}, document.title, "/");
        setUserData(res);
      });
    } else if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData());
    }
  }, []);

  const authOptions: AuthOptions = {
    appDetails: {
      name: "Blockstack App",
      icon: window.location.origin + "/favicon.ico",
    },
    userSession,
    finished: ({ userSession }) => {
      setUserData(userSession.loadUserData());
    },
  };
  return (
    <Connect authOptions={authOptions}>
      <div className="site-wrapper">
        <div className="site-wrapper-inner">
          {!userData ? (
            <SignIn />
          ) : (
            <Profile userData={userData} handleSignOut={handleSignOut} />
          )}
        </div>
      </div>
    </Connect>
  );
};

export default App;
