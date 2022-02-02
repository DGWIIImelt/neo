#!/usr/bin/env sh

echo "Choose Action:"
actions=("search" "getDistanceFromMe" "Quit")
select action in "${actions[@]}"; do
    case $action in
        "search")
            chosenAction="search"
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

node ./dist/index.js $chosenAction $query
