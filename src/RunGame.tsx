import { Text, Flex, Button } from "@chakra-ui/react";
import { collection, deleteField, doc, setDoc } from "firebase/firestore";
import { useFirestore, useFirestoreCollectionData } from "reactfire";

const RunGame = () => {
  const
    firestore = useFirestore(),
    gamePlayersCollection = collection(firestore, "gamePlayers"),
    gamePlayers = useFirestoreCollectionData(gamePlayersCollection),
    gameDataCollection = collection(firestore, "gameData"),
    gameData = useFirestoreCollectionData(gameDataCollection);

  const timeOfDay = gameData.data?.reduce((_, m) => m.timeOfDay, "night");

  const
    haveMafiasSelected = (): boolean => {
      return gamePlayers.data?.reduce((v, m) =>
        (m.role == "mafia")
          ? v && (m.selectedTarget != undefined)
          : v
        , true);
    },
    haveGuardiansSelected = (): boolean => {
      return gamePlayers.data?.reduce((v, m) =>
        (m.role == "guardian")
          ? v && (m.selectedTarget != undefined)
          : v
        , true);
    },
    hasEveryoneVoted = (): boolean => {
      return gamePlayers.data?.reduce((v, m) =>
        v && m.selectedTarget != undefined
        , true);
    },
    isReady = (): boolean => {
      return (timeOfDay == "night")
        ? haveMafiasSelected() && haveGuardiansSelected()
        : (timeOfDay == "day")
          ? hasEveryoneVoted()
          : false;
    },
    totalAlivePeople = () => {
      return gamePlayers.data?.reduce((count, m) =>
        (!m.dead) ? count + 1 : count
        , 0) || 0;
    },
    totalPeopleReady = () => {
      return gamePlayers.data?.reduce((count, m) =>
        (!m.dead && m.selectedTarget) ? count + 1 : count
        , 0) || 0;
    },
    continueGame = () => {
      if (!isReady()) return;

      if (timeOfDay == "night") {
        // get killed people, then put guarded people,
        // unless it exists in killed people, so put it
        // in saved people, and reveal all killed peoples
        // associations.
        const
          killed: string[] = [],
          guarded: string[] = [],
          saved: string[] = [];

        gamePlayers.data?.map((m) => {
          if (m.role == "mafia") {
            if (guarded.findIndex((p) => p == m.selectedTarget) == -1) {
              killed.push(m.selectedTarget);
            } else {
              saved.push(m.selectedTarget);
            }
          } else if (m.role == "guardian") {
            if (killed.findIndex((p) => p == m.selectedTarget) == -1) {
              guarded.push(m.selectedTarget);
            } else {
              saved.push(m.selectedTarget);
            }
          }
        });

        gamePlayers.data?.map((m) => {
          if (killed.findIndex((p) => p == m.name) == -1) return;
          setDoc(doc(firestore, "gamePlayers", m.uid), { dead: true }, { merge: true });
        });

        setDoc(doc(firestore, "gameData", "0"),
          { timeOfDay: "day" }, { merge: true });

        gamePlayers.data?.map((m) => {
          if (m.role != "jester") return;
          setDoc(doc(firestore, "gamePlayers", m.uid), {
            selectedTarget: m.name
          });
        });
      } else if (timeOfDay == "day") {
        // { "Aryan Ahire": 1, "skip": 2 } <- like this
        const voteMap: Map<string, number> = new Map();

        // vote out person/skip and check if anyone won

        setDoc(doc(firestore, "gameData", "0"),
          { timeOfDay: "night" }, { merge: true });
      } else {
        const error = "Time of day is " + timeOfDay + "!";
        console.error(error);
        alert(error);
      }

      gamePlayers.data?.map((m) => {
        setDoc(doc(firestore, "gamePlayers", m.uid),
          { selectedTarget: deleteField() }, { merge: true });
      });
    };

  return (
    <Flex
      width="30vw" height="100vh"
      backgroundColor="darkBg"
      alignItems="center" justifyContent="center" padding="20px"
      flexDir="column" rowGap="25px"
    >
      {
        (isReady())
          ? <Button
            fontSize="5xl"
            padding="30px"
            bgColor="blue"
            _hover={{ backgroundColor: "lightBlue" }}
            onClick={continueGame}
          >Continue</Button>
          : <Button
            fontSize="5xl"
            padding="30px"
            bgColor="darkBlue"
            isDisabled
          >Continue</Button>
      }
      {
        (timeOfDay == "night")
          ?
          [
            <Text fontSize="4xl">Mafias Ready: <Text display="inline" color={haveMafiasSelected() ? "green" : "red"}>{haveMafiasSelected().toString()}</Text></Text>,
            <Text fontSize="4xl">Guardians Ready: <Text display="inline" color={haveGuardiansSelected() ? "green" : "red"}>{haveGuardiansSelected().toString()}</Text></Text>
          ]
          : (timeOfDay == "day")
            ? <Text fontSize="4xl">People Ready: <Text display="inline" color={hasEveryoneVoted() ? "green" : "red"}>{totalPeopleReady()}/{totalAlivePeople()}</Text></Text>
            : <Text>Invalid `timeOfDay: {timeOfDay}`</Text>
      }
    </Flex>
  )
}

export default RunGame;
