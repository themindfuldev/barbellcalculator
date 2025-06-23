import React, { useState, useEffect } from 'react';

// Main App component for the barbell plate calculator
const App = () => {
  // State for the unit of measurement (kg or lb)
  const [unit, setUnit] = useState('kg');
  // State for the barbell's weight
  const [barbellWeight, setBarbellWeight] = useState(15); // Default to 20kg
  // State for the available plates, initialized with common kg plates
  const [availablePlates, setAvailablePlates] = useState([
    { id: 1, weight: 25, count: 0 },
    { id: 2, weight: 20, count: 4 },
    { id: 3, weight: 15, count: 2 },
    { id: 4, weight: 10, count: 4 },
    { id: 5, weight: 5, count: 4 },
    { id: 6, weight: 2.5, count: 4 },
    { id: 7, weight: 1.25, count: 4 },
    { id: 8, weight: 0.5, count: 4 },
    { id: 9, weight: 0.25, count: 2 }
  ]);
  const [maxLoad, setMaxLoad] = useState(
    availablePlates.reduce(
      (acc, plate) => acc + plate.weight * plate.count
      , 0)
  );
  // State for the target total weight the user wants to lift
  const [targetWeight, setTargetWeight] = useState(0); // Default to 100kg
  // State to store the calculation result
  const [calculationResult, setCalculationResult] = useState('');
  // State to manage the next ID for new plates
  const [nextPlateId, setNextPlateId] = useState(10);

  useEffect(() => setMaxLoad(
    availablePlates.reduce(
      (acc, plate) => acc + plate.weight * plate.count
      , 0)
  ), [availablePlates])

  // Effect to update available plates when the unit changes
  useEffect(() => {
    if (unit === 'kg') {
      setAvailablePlates([
        { id: 1, weight: 25, count: 0 },
        { id: 2, weight: 20, count: 4 },
        { id: 3, weight: 15, count: 2 },
        { id: 4, weight: 10, count: 4 },
        { id: 5, weight: 5, count: 4 },
        { id: 6, weight: 2.5, count: 4 },
        { id: 7, weight: 1.25, count: 4 },
        { id: 8, weight: 0.5, count: 4 },
        { id: 9, weight: 0.25, count: 2 }
      ]);
      setBarbellWeight(15); // Default barbell weight for kg
      setNextPlateId(10);
    } else {
      setAvailablePlates([
        { id: 1, weight: 55, count: 2 },
        { id: 2, weight: 45, count: 4 },
        { id: 3, weight: 35, count: 2 },
        { id: 4, weight: 25, count: 4 },
        { id: 5, weight: 10, count: 4 },
        { id: 6, weight: 5, count: 4 },
        { id: 7, weight: 2.5, count: 4 },
        { id: 8, weight: 1.25, count: 4 },
        { id: 9, weight: 0.5, count: 2 }
      ]);
      setBarbellWeight(35); // Default barbell weight for lb
      setNextPlateId(10);
    }
    setCalculationResult(''); // Clear result on unit change
  }, [unit]);

  // Function to handle changes in plate weight or count
  const handlePlateChange = (id, field, value) => {
    setAvailablePlates(prevPlates =>
      prevPlates.map(plate =>
        plate.id === id ? { ...plate, [field]: parseFloat(value) || 0 } : plate
      )
    );
  };

  // Function to add a new plate type to the available plates list
  const addPlate = () => {
    setAvailablePlates(prevPlates => [
      ...prevPlates,
      { id: nextPlateId, weight: 0, count: 0 }
    ]);
    setNextPlateId(prevId => prevId + 1);
  };

  // Function to remove a plate type from the available plates list
  const removePlate = (id) => {
    setAvailablePlates(prevPlates => prevPlates.filter(plate => plate.id !== id));
  };

  // Main calculation logic
  const calculatePlates = () => {
    // Validate inputs
    if (targetWeight <= 0 || barbellWeight <= 0) {
      setCalculationResult('Please enter valid positive numbers for target and barbell weight.');
      return;
    }
    if (targetWeight < barbellWeight) {
      setCalculationResult('Target weight cannot be less than barbell weight.');
      return;
    }

    // Calculate the total weight needed from plates
    const weightFromPlates = targetWeight - barbellWeight;
    // Calculate the weight needed per side
    const weightPerSide = weightFromPlates / 2;

    // Create a mutable copy of available plates for calculation
    let platesRemaining = availablePlates
      .filter(p => p.weight > 0 && p.count > 0) // Filter out invalid plates
      .map(p => ({ ...p })); // Deep copy to avoid modifying original state

    // Sort plates in descending order of weight for greedy approach
    platesRemaining.sort((a, b) => b.weight - a.weight);

    let currentWeightPerSide = weightPerSide;
    const platesNeeded = {}; // To store plates needed per side

    // Iterate through sorted plates to determine the count for each
    for (const plate of platesRemaining) {
      if (currentWeightPerSide >= plate.weight) {
        // Calculate how many of this plate can be used for one side
        const numPlatesForSide = Math.floor(currentWeightPerSide / plate.weight);
        // Ensure we don't use more plates than available (half of total count)
        const actualPlatesToUse = Math.min(numPlatesForSide, plate.count / 2);

        if (actualPlatesToUse > 0) {
          platesNeeded[plate.weight] = actualPlatesToUse;
          currentWeightPerSide -= actualPlatesToUse * plate.weight;
        }
      }
    }

    // Check if the exact weight per side was achieved
    if (currentWeightPerSide.toFixed(2) !== '0.00') {
      setCalculationResult(`Cannot precisely load ${targetWeight}${unit} with available plates. Remaining weight per side: ${currentWeightPerSide.toFixed(2)}${unit}.`);
      return;
    }

    // Format the output string
    let resultString = `
            <p class="text-lg font-semibold mb-2">Calculation for ${targetWeight}${unit}:</p>
            <p>${targetWeight}${unit} - ${barbellWeight}${unit} (barbell) = ${weightFromPlates}${unit} of weights</p>
            <p>${weightFromPlates}${unit} / 2 sides = ${weightPerSide}${unit} per side</p>
            <p class="mt-4 font-semibold">Plates needed per side:</p>
        `;

    const sortedNeededPlates = Object.keys(platesNeeded)
      .map(Number)
      .sort((a, b) => b - a); // Sort descending for display

    if (sortedNeededPlates.length === 0) {
      resultString += `<p>No plates needed (target weight equals barbell weight).</p>`;
    } else {
      sortedNeededPlates.forEach(weight => {
        resultString += `<p class="ml-4">${platesNeeded[weight]}x${weight}${unit}</p>`;
      });
    }

    setCalculationResult(resultString);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-gray-100 p-4 sm:p-8 font-inter">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-2xl p-6 sm:p-8 border border-gray-700">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center text-indigo-400 mb-8 drop-shadow-lg">
          Barbell Plate Calculator
        </h1>

        {/* Variable Input Section */}
        <div className="mb-8 p-6 bg-gray-700 rounded-lg shadow-inner border border-gray-600">
          <h2 className="text-2xl font-bold text-indigo-300 mb-4">Variable Input</h2>
          <div className="mb-4">
            <label htmlFor="targetWeight" className="block text-gray-300 text-sm font-medium mb-2">
              Target Weight ({unit}):
            </label>

            <input
              id="targetWeight"
              className="w-full p-3 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
              value={targetWeight}
              onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={calculatePlates}
          className="w-full p-4 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xl rounded-lg shadow-xl transform hover:scale-105 transition duration-300 ease-in-out flex items-center justify-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
          </svg>
          <span>Calculate Plates</span>
        </button>

        {/* Calculation Result */}
        {calculationResult && (
          <div className="mt-8 p-6 bg-gray-700 rounded-lg shadow-inner border border-gray-600">
            <h2 className="text-2xl font-bold text-indigo-300 mb-4">Result</h2>
            <div
              className="text-gray-200 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: calculationResult }}
            ></div>
          </div>
        )}

        {/* Fixed Inputs Section */}
        <div className="mt-8 p-6 bg-gray-700 rounded-lg shadow-inner border border-gray-600">
          <h2 className="text-2xl font-bold text-indigo-300 mb-4">Fixed Inputs</h2>

          {/* Unit Selection */}
          <div className="mb-4">
            <label htmlFor="unit" className="block text-gray-300 text-sm font-medium mb-2">
              Unit:
            </label>
            <select
              id="unit"
              className="w-full p-3 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              <option value="kg">Kilograms (kg)</option>
              <option value="lb">Pounds (lb)</option>
            </select>
          </div>

          {/* Barbell Weight Input */}
          <div className="mb-4">
            <label htmlFor="barbellWeight" className="block text-gray-300 text-sm font-medium mb-2">
              Barbell Weight ({unit}):
            </label>
            <input
              id="barbellWeight"
              className="w-full p-3 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
              value={barbellWeight}
              onChange={(e) => setBarbellWeight(parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Available Plates Section */}
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Available Plates (Total Count):
            </label>
            <div className="space-y-3">
              {availablePlates.map(plate => (
                <div key={plate.id} className="flex items-center space-x-3 bg-gray-600 p-3 rounded-md border border-gray-500">
                  <input
                    type="number"
                    placeholder="Weight"
                    className="w-1/2 p-2 bg-gray-700 border border-gray-500 rounded-md text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                    value={plate.weight}
                    onChange={(e) => handlePlateChange(plate.id, 'weight', e.target.value)}
                    min="0"
                    step="0.25"
                  />
                  <span className="text-gray-300">{unit}</span>
                  <input
                    type="number"
                    placeholder="Count"
                    className="w-1/2 p-2 bg-gray-700 border border-gray-500 rounded-md text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                    value={plate.count}
                    onChange={(e) => handlePlateChange(plate.id, 'count', e.target.value)}
                    min="0"
                    step="1"
                  />
                  <button
                    onClick={() => removePlate(plate.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition duration-200 shadow-md flex items-center justify-center"
                    aria-label="Remove plate"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addPlate}
              className="mt-4 w-full p-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md shadow-lg transition duration-200 flex items-center justify-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Add Plate Type</span>
            </button>
            <div className="space-y-3 mt-2"><b>Maximum load:</b> {maxLoad} ({unit})</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;