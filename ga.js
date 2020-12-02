// =======================
// Genetic algorithm
// =======================
function NextGeneration() {
  console.log('next generation');
  CalculateFitness();
  for (let i = 0; i < amountDoodlers; i++) {
    doodlers[i] = PickOne();
  }
  for (let i = 0; i < amountDoodlers; i++) {
    deadDoodlers[i].Dispose();
  }
  deadDoodlers = [];
  scores = [];
  averageScore = 0;
  generation++
}

function PickOne() {
  let index = 0;
  let r = random(1);
  while (r > 0 && index < amountDoodlers-1) {
    r = r - deadDoodlers[index].fitness;
    index++;
  }
  index--;
  let doodler = deadDoodlers[index];
  let child = doodler.Copy();
  child.Mutate(0.3);
  return child;
}

function CalculateFitness() {
  let scoreSum = 0;
  let badJumpSum = 0;
  for (let doodler of deadDoodlers) {
    scoreSum += doodler.actualScore; // game scores sum of all dead doodlers
    badJumpSum += doodler.jumpsOnSamePlatform; // repeated jumps sum of all doodlers
  }
  for (let doodler of deadDoodlers) {
    // better score = better fitness, higher bad jumps = lower fitness
    doodler.fitness = (doodler.actualScore - (10 * badJumpSum)) / (scoreSum + (10 * badJumpSum));
  }
}