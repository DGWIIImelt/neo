#!/usr/bin/env sh

echo "Choose Action:"
actions=("search" "getSatPropagate" "getOrbit" "getOrbits24hrs" "getNearMe24hrs" "getDistanceFromMe" "getNearMeOneOrbit" "test" "createTestData" "Quit")
select action in "${actions[@]}"; do
    case $action in
        "search")
            chosenAction="search"
            break;;
        "getSatPropagate")
            chosenAction="getSatPropagate"
            break;;
        "getDistanceFromMe")
            chosenAction="getDistanceFromMe"
            break;;
        "getOrbit")
            chosenAction="getOrbit"
            break;;
        "getOrbits24hrs")
            chosenAction="getOrbits24hrs"
            break;;
        "getNearMe24hrs")
            chosenAction="getNearMe24hrs"
            break;;
        "getNearMeOneOrbit")
            chosenAction="getNearMeOneOrbit"
            break;;
        "test")
            chosenAction="test"
            break;;
        "createTestData")
            chosenAction="createTestData"
            break;;
        "Quit")
            echo "User requested exit"
            exit;;
        *) echo "invalid option $REPLY";;
    esac
done

echo "Query/ID:"
read query

if [[ ( $chosenAction = "getSatPropagate" || $chosenAction = "getOrbit" || $chosenAction = "getOrbits24hrs" || $chosenAction = "getNearMe24hrs" || $chosenAction = "getNearMeOneOrbit" || $chosenAction = "getDistanceFromMe" || $chosenAction = "createTestData") && $query = "" ]]; then
  while [[ $query = "" ]]
  do
    echo "Query/ID is required for this action:"
    read query
  done
fi

node ./dist/index.js $chosenAction $query --experimental-json-modules
