import { Rating, createEmptyCard, fsrs, generatorParameters } from 'ts-fsrs';

const params = generatorParameters({ enable_fuzz: true });
const f = fsrs(params);
const firstPassTime = new Date(); // new Date();
const cardFirstPass = createEmptyCard(firstPassTime); // createEmptyCard();
const schedulingCardsFirstPass = f.repeat(cardFirstPass, firstPassTime);

console.log(cardFirstPass);
{
  // user selected hard
  const { card: cardFirstResult } = schedulingCardsFirstPass[Rating.Hard];
  console.log('-----------------FIRST SELECTION: HARD--------------');
  console.log(cardFirstResult);

  const secondPassTime = new Date(cardFirstResult.due);
  const schedulingCardsSecondPass = f.repeat(cardFirstResult, secondPassTime);
  {
    const { card: cardSecondResult } = schedulingCardsSecondPass[Rating.Hard];
    console.log('-----------------SECOND SELECTION: HARD--------------');
    console.log(cardSecondResult);
  }
  {
    const { card: cardSecondResult } = schedulingCardsSecondPass[Rating.Easy];
    console.log('-----------------SECOND SELECTION: EASY--------------');
    console.log(cardSecondResult);

    const thirdPassTime = new Date(cardSecondResult.due);
    const schedulingCardsThirdPass = f.repeat(cardSecondResult, thirdPassTime);
    const { card: cardThirdResult } = schedulingCardsThirdPass[Rating.Easy];
    console.log('-----------------THIRD SELECTION: EASY--------------');
    console.log(cardThirdResult);

    const fourPassTime = new Date(cardThirdResult.due);
    const schedulingCardsFourPass = f.repeat(cardThirdResult, fourPassTime);
    const { card: cardFourResult } = schedulingCardsFourPass[Rating.Easy];
    console.log('-----------------FOUR SELECTION: EASY--------------');
    console.log(cardFourResult);
  }
}

{
  // user selected hard
  const { card: cardFirstResult } = schedulingCardsFirstPass[Rating.Easy];
  console.log('-----------------FIRST SELECTION: EASY--------------');
  console.log(cardFirstResult);

  const secondPassTime = new Date();
  const schedulingCardsSecondPass = f.repeat(cardFirstResult, secondPassTime);
  {
    const { card: cardSecondResult } = schedulingCardsSecondPass[Rating.Hard];
    console.log('-----------------SECOND SELECTION: HARD--------------');
    console.log(cardSecondResult);
  }
  {
    const { card: cardSecondResult } = schedulingCardsSecondPass[Rating.Easy];
    console.log('-----------------SECOND SELECTION: EASY--------------');
    console.log(cardSecondResult);
  }
}

// NOTE: if the user re reviews a card before its due date the algorithm goes crazy

// console.log(scheduling_cards);
// Grades.forEach((grade) => {
//   // [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy]
//   const { log, card } = scheduling_cards[grade];
//   console.group(`${Rating[grade]}`);
//   console.table({
//     [`card_${Rating[grade]}`]: {
//       ...card,
//       due: formatDate(card.due),
//       last_review: formatDate(card.last_review as Date),
//     },
//   });
//   console.table({
//     [`log_${Rating[grade]}`]: {
//       ...log,
//       review: formatDate(log.review),
//     },
//   });
//   console.groupEnd();
//   console.log(
//     '----------------------------------------------------------------',
//   );
// });
