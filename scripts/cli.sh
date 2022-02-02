#!/usr/bin/env sh

echo "Choose Action:"
actions=("search" "getSatPropagate" "getDistanceFromMe" "Quit")
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
        "Quit")
            echo "User requested exit"
            exit;;
        *) echo "invalid option $REPLY";;
    esac
done

echo "Query/ID:"
read query

if [[ ( $chosenAction = "getSatPropagate" || $chosenAction = "getDistanceFromMe" ) && $query = "" ]]; then
  while [[ $query = "" ]]
  do
    echo "Query/ID is required for this action:"
    read query
  done
fi

node ./dist/index.js $chosenAction $query
