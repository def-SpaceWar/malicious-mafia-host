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
    roundNumber = gameData.data?.reduce((num, m) =>
      m.roundNumber ? m.roundNumber : num
      , 0) || 0,
    haveAssasinsSelected = (): boolean => {
      return (roundNumber % 2 == 0)
        ? gamePlayers.data?.reduce((v, m) =>
          (m.role == "assasin" || m.dead)
            ? v && (m.dead || m.selectedTarget != undefined)
            : v
          , true)
        : true;
    },
    haveMafiasSelected = (): boolean => {
      return gamePlayers.data?.reduce((v, m) =>
        (m.role == "mafia")
          ? v && (m.dead || m.selectedTarget != undefined)
          : v
        , true) && haveAssasinsSelected();
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
      let gameOver = false;

      if (timeOfDay == "night") {
        const
          killed: string[] = [],
          guarded: string[] = [],
          saved: string[] = [],
          assasinated: string[] = [];

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
          } else if (m.role == "assasin" && roundNumber % 2 == 0) {
            assasinated.push(m.selectedTarget);
          }
        });

        gamePlayers.data?.map((m) => {
          if (killed.findIndex((p) => p == m.name) == -1) return;
          setDoc(doc(firestore, "gamePlayers", m.uid), { dead: true }, { merge: true });
          messages.push(m.name + " got killed by the Mafia.");
          messages.push(m.name + ` was ${associationWithPrefix(getAssociation(m.name))}.`);
        });

        gamePlayers.data?.map((m) => {
          if (assasinated.findIndex((p) => p == m.name) == -1) return;
          setDoc(doc(firestore, "gamePlayers", m.uid), { dead: true }, { merge: true });
          messages.push(m.name + " got assasinated by the Mafia.");
          messages.push(m.name + ` was ${associationWithPrefix(getAssociation(m.name))}.`);
          const idx = guarded.findIndex((p) => p == m.selectedTarget);
          if (idx != -1) guarded.splice(idx, 1);
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
          if (m.role == "mayor") voteMap.set(m.selectedTarget, voteMap.get(m.selectedTarget)! + 1);
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
            const loserUid = gamePlayers.data?.find((m) => m.name == firstPlace[0])!.uid;
            setDoc(doc(firestore, "gamePlayers", loserUid), { dead: true }, { merge: true });

            if (gamePlayers.data?.find(m => m.uid == loserUid)?.role == "jester") {
              gameOver = true;
              setDoc(doc(firestore, "gameData", "0"), {
                gameOver,
                message: firstPlace[0] + " won!",
                winner: "jester"
              }, { merge: true });
            }
          }
        } else {
          messages.push("Tie!");
        }

        setDoc(doc(firestore, "gameData", "0"),
          { timeOfDay: "night", roundNumber: roundNumber + 1 }, { merge: true });
      } else {
        const error = "Time of day is " + timeOfDay + "!";
        console.error(error);
        alert(error);
      }

      if (gameOver) return;
      sendMessages(messages);

      gamePlayers.data?.map((m) => {
        if (m.role == "jester") return;
        setDoc(doc(firestore, "gamePlayers", m.uid),
          { selectedTarget: deleteField() }, { merge: true });
      });
    };

  const gameOver = gameData.data?.reduce((gameOver, m) => m.gameOver ? m.gameOver : gameOver, false);
  if (!gameOver) {
    let
      mafiasAlive = 0,
      guardiansAlive = 0,
      otherAlive = 0,
      innocentsAlive = 0;

    gamePlayers.data?.map((m) => {
      if (m.dead) return;
      if (m.association == "mafia") mafiasAlive++;
      if (m.role == "guardian") guardiansAlive++;
      if (m.association == "innocent") innocentsAlive++;
      if (m.association != "mafia") otherAlive++;
    });

    const
      onlyGuardiansAlive = guardiansAlive == otherAlive && guardiansAlive > 0,
      guardianAndMafiaLeft = onlyGuardiansAlive && mafiasAlive > 0 && guardiansAlive <= mafiasAlive,
      onlyMafiaLeft = otherAlive == 0 && mafiasAlive > 0,
      onlyInnocentLeft = mafiasAlive == 0 && innocentsAlive > 0,
      onlyThirdPartyLeft = mafiasAlive == 0 && innocentsAlive == 0;

    if (guardianAndMafiaLeft) {
      setDoc(doc(firestore, "gameData", "0"), {
        gameOver: true,
        message: "Tie! Between Mafia and Innocent.",
        winner: "tie"
      }, { merge: true });
    } else if (onlyMafiaLeft) {
      setDoc(doc(firestore, "gameData", "0"), {
        gameOver: true,
        message: "Mafia won!",
        winner: "mafia"
      }, { merge: true });
    } else if (onlyInnocentLeft) {
      setDoc(doc(firestore, "gameData", "0"), {
        gameOver: true,
        message: "Innocents won!",
        winner: "innocent"
      }, { merge: true });
    } else if (onlyThirdPartyLeft) {
      setDoc(doc(firestore, "gameData", "0"), {
        gameOver: true,
        message: "Undecided, only third parties left.",
        winner: "tie"
      }, { merge: true });
    }
  }

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
            _hover={{ backgroundColor: "darkBlue" }}
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
