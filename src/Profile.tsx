import React from "react";
import { Person, lookupProfile } from "blockstack";
import { UserData } from "blockstack/lib/auth/authApp";
import { useConnect } from "@blockstack/connect";
import { RouteComponentProps } from "react-router-dom";

const avatarFallbackImage =
  "https://s3.amazonaws.com/onename/avatar-placeholder.png";

interface IProps {
  userData: UserData;
  handleSignOut: (e: React.SyntheticEvent) => void;
}

interface IStatus {
  id: number;
  text: string;
  created_at: number;
}

export const Profile: React.FC<
  IProps & RouteComponentProps<{ username?: string }>
> = ({ userData, handleSignOut, match }) => {
  const isLocal = () => {
    return match.params.username ? false : true;
  };
  const [newStatus, setNewStatus] = React.useState("");
  const [statuses, setStatuses] = React.useState<IStatus[]>([]);
  const [statusIndex, setStatusIndex] = React.useState(0);
  const [isLoading, setLoading] = React.useState(false);
  const [username, setUsername] = React.useState(userData.username);
  const [person, setPerson] = React.useState(new Person(userData.profile));
  const { authOptions } = useConnect();
  const { userSession } = authOptions;
  const saveStatuses = async (_statuses: IStatus[]) => {
    const options = { encrypt: false };
    setStatuses(_statuses);
    await userSession?.putFile(
      "statuses.json",
      JSON.stringify(_statuses),
      options
    );
  };
  const saveNewStatus = async (statusText: string) => {
    const _statuses = statuses;

    let status = {
      id: statusIndex + 1,
      text: statusText.trim(),
      created_at: Date.now(),
    };

    _statuses.unshift(status);
    await saveStatuses(_statuses);
    setStatusIndex(statusIndex + 1);
  };
  const handleNewStatus = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewStatus(event.target.value);
  };

  const handleNewStatusSubmit = async () => {
    await saveNewStatus(newStatus);
    setNewStatus("");
  };

  const fetchData = async () => {
    setLoading(true);
    if (isLocal()) {
      const options = { decrypt: false };
      const file = (await userSession?.getFile(
        "statuses.json",
        options
      )) as string;
      const _statuses = JSON.parse(file || "[]");
      setStatusIndex(_statuses.length);
      setStatuses(_statuses);
      setLoading(false);
    } else {
      const username = match.params.username as string;

      try {
        const newProfile = await lookupProfile(username);
        setPerson(new Person(newProfile));
        setUsername(username);
        const options = { username: username, decrypt: false };
        const file = (await userSession?.getFile(
          "statuses.json",
          options
        )) as string;
        const _statuses = JSON.parse(file || "[]");
        setStatusIndex(_statuses.length);
        setStatuses(_statuses);
        setLoading(false);
      } catch (error) {
        console.log("Could not resolve profile");
      }
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [username]);

  const handleDelete = (id: number) => {
    setStatuses((state) => {
      const newStatuses = state.filter((status) => status.id !== id);

      saveStatuses(newStatuses);

      return newStatuses;
    });
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col-md-offset-3 col-md-6">
          <div className="col-md-12">
            <div className="avatar-section">
              <img
                src={
                  person.avatarUrl() ? person.avatarUrl() : avatarFallbackImage
                }
                className="img-rounded avatar"
                id="avatar-image"
              />
              <div className="username">
                <h1>
                  <span id="heading-name">
                    {person.name() ? person.name() : "Nameless Person"}
                  </span>
                </h1>
                <span>{username}</span>
                {isLocal() && (
                  <span>
                    &nbsp;|&nbsp;
                    <a onClick={handleSignOut}>(Logout)</a>
                  </span>
                )}
              </div>
            </div>
          </div>
          {isLocal() && (
            <div className="new-status">
              <div className="col-md-12">
                <textarea
                  className="input-status"
                  value={newStatus}
                  onChange={handleNewStatus}
                  placeholder="What's on your mind?"
                />
              </div>
              <div className="col-md-12 text-right">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleNewStatusSubmit}
                >
                  Submit
                </button>
              </div>
            </div>
          )}
          <div className="col-md-12 statuses">
            {isLoading && <span>Loading...</span>}
            {statuses.map((status) => (
              <div className="status" key={status.id}>
                {status.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
