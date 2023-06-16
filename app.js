const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "covid19India.db");
app.use(express.json());
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DBError:${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const convertIntoCamelCase = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

//1.Get states API
app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `
    SELECT * FROM
    state
    ORDER BY state_id;`;
  const getAllStatesArray = await db.all(getAllStatesQuery);
  response.send(
    getAllStatesArray.map((eachState) => convertIntoCamelCase(eachState))
  );
});

//2.Get States Based On State Id API
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateIdQuery = `
    SELECT state_id as stateId,
    state_name as stateName,
    population as population
    FROM
    state
    WHERE state_id=${stateId};`;
  const getStateDetailsBasedOnId = await db.get(getStateIdQuery);
  response.send(getStateDetailsBasedOnId);
});
//3.Add New District API
app.post("/districts/", async (request, response) => {
  const newDistrictDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = newDistrictDetails;
  const addNewDistrictQuery = `
    INSERT INTO
    district 
    (district_name,state_id,cases,cured,active,deaths)
    VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  await db.run(addNewDistrictQuery);
  response.send("District Successfully Added");
});

//4.Get District Based On DistrictId API
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
    SELECT district_id as districtId,
    district_name as districtName,
    state_id as stateId,
    cases,
    cured,active,deaths FROM district
    WHERE district_id=${districtId};`;
  const getDistrictBasedOnId = await db.get(getDistrictIdQuery);
  response.send(getDistrictBasedOnId);
});

//5.Delete District API
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district
    WHERE district_id=${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//6.Update District Details API
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const newDistrictDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = newDistrictDetails;
  const updateDistrictDetailsQuery = `
    UPDATE district SET
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    WHERE district_id=${districtId};`;
  await db.run(updateDistrictDetailsQuery);
  response.send("District Details Updated");
});
//7.Get Total Covid Cases Based On StateId API
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsOfCovidCasesOfStateQuery = `
    SELECT 
    SUM(cases) as totalCases,
    SUM(cured) as totalCured,
    SUM(active) as totalActive,
    SUM(deaths) as totalDeaths
    FROM district
    WHERE state_id=${stateId};`;
  const covidCasesStatistics = await db.get(getStatsOfCovidCasesOfStateQuery);
  response.send(covidCasesStatistics);
});

//8.Get StateName Based On DistrictId API
app.get("/districts/:districtId/details/",async(request,response)=>{
    const {districtId}=request.params;
    const getStateNameBasedOnDistrictIdQuery=`
    SELECT state_name as stateName
    FROM state JOIN district ON state.state_id=district.state_id
    WHERE district_id=${districtId};`;
    const getStateName = await db.get(getStateNameBasedOnDistrictIdQuery);
    response.send(getStateName);
});
module.exports = app;
