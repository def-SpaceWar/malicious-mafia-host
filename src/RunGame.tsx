import { Text, Flex, Button } from "@chakra-ui/react";
import { collection, deleteField, doc, setDoc } from "firebase/firestore";
import { useFirestore, useFirestoreCollectionData } from "reactfire";
import { Association } from "./HostGame";

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
          ? v && (m.dead || m.selectedTarget != undefined)
          : v
        , true);
    },
    haveGuardiansSelected = (): boolean => {
      return gamePlayers.data?.reduce((v, m) =>
        (m.role == "guardian")
          ? v && (m.dead || m.selectedTarget != undefined)
          : v
        , true);
    },
    hasEveryoneVoted = (): boolean => {
      return gamePlayers.data?.reduce((v, m) =>
        v && (m.dead || m.selectedTarget != undefined)
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
    sendMessages = (msgs: string[]) => {
      const message = msgs.join(" ");
      setDoc(doc(firestore, "gameData", "0"), { message }, { merge: true });
    },
    getAssociation = (name: string): Association => {
      return gamePlayers.data.reduce((association, m) => (m.name == name) ? m.association : association, "innocent");
    },
    associationWithPrefix = (association: Association) => {
      return (association == "innocent")
        ? "an innocent"
        : "a " + association;
    },
    continueGame = () => {
      if (!isReady()) return;

      const messages = [];

      if (timeOfDay == "night") {
        const
          killed: string[] = [],
          guarded: string[] = [],
          saved: string[] = [];

        gamePlayers.data?.map((m) => {
          if (m.role == "mafia") {
            if (guarded.findIndex((p) => p == m.selectedTarget) == -1) {
              killed.push(m.selectedTarget);
            } else {
              guarded.splice(guarded.findIndex((p) => p == m.selectedTarget, 1));
              saved.push(m.selectedTarget);
            }
          } else if (m.role == "guardian") {
            if (killed.findIndex((p) => p == m.selectedTarget) == -1) {
              guarded.push(m.selectedTarget);
            } else {
              killed.splice(killed.findIndex((p) => p == m.selectedTarget, 1));
              saved.push(m.selectedTarget);
            }
          }
        });

        gamePlayers.data?.map((m) => {
          if (killed.findIndex((p) => p == m.name) == -1) return;
          setDoc(doc(firestore, "gamePlayers", m.uid), { dead: true }, { merge: true });
          messages.push(m.name + " got killed by the Mafia.");
          messages.push(m.name + ` was ${associationWithPrefix(getAssociation(m.name))}.`);
        });

        guarded.map((m) => messages.push(m + " was guarded."));
        saved.map((m) => messages.push(m + " was saved from the Mafia."));

        setDoc(doc(firestore, "gameData", "0"),
          { timeOfDay: "day" }, { merge: true });

        gamePlayers.data?.map((m) => {
          if (m.role != "jester") return;
          setDoc(doc(firestore, "gamePlayers", m.uid), {
            selectedTarget: m.name
          }, { merge: true });
        });
      } else if (timeOfDay == "day") {
        /** { "Aryan Ahire": 1, "skip": 2 } <- like this */
        const voteMap: Map<string, number> = new Map();

        gamePlayers.data?.map((m) => {
          if (!m.selectedTarget) return;
          if (!voteMap.get(m.selectedTarget)) voteMap.set(m.selectedTarget, 0);
          voteMap.set(m.selectedTarget, voteMap.get(m.selectedTarget)! + 1);
        });

        const
          entries: [a: string, b: number][] = [],
          iterator = voteMap.entries();

        let result = iterator.next();
        while (!result.done) {
          entries.push(result.value);
          result = iterator.next();
        }
        entries.sort((a, b) => b[1] - a[1]);

        const
          firstPlace = entries[0],
          secondPlace = entries[1] || ["", -1];

        if (firstPlace[1] > secondPlace[1]) {
          if (firstPlace[0] == "skip") {
            messages.push("Voting skipped!");
          } else {
            messages.push(firstPlace[0] + " got voted out!");
            messages.push(firstPlace[0] + ` was ${associationWithPrefix(getAssociation(firstPlace[0]))}.`);
            const loserUid = gamePlayers.data!.find((m) => m.name == firstPlace[0])!.uid;
            setDoc(doc(firestore, "gamePlayers", loserUid), { dead: true }, { merge: true });
          }
        } else {
          messages.push("Tie!");
        }

        setDoc(doc(firestore, "gameData", "0"),
          { timeOfDay: "night" }, { merge: true });
      } else {
        const error = "Time of day is " + timeOfDay + "!";
        console.error(error);
        alert(error);
      }

      sendMessages(messages);

      gamePlayers.data?.map((m) => {
        if (m.role == "jester") return;
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
