#!/usr/bin/env sh

echo "Choose Action:"
actions=("search" "getById" "getByIdWithMath" "Quit")
select action in "${actions[@]}"; do
    case $action in
        "search")
            chosenAction="search"
            break;;
        "getById")
            chosenAction="getById"
            break;;
        "getByIdWithMath")
            chosenAction="getByIdWithMath"
            break;;
        "Quit")
            echo "User requested exit"
            exit;;
        *) echo "invalid option $REPLY";;
    esac
done

echo "Query/ID:"
read query

node index.js $chosenAction $query
