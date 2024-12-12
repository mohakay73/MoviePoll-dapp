// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";
import {MoviePoll} from "../src/MoviePoll.sol";

contract MoviePollScript is Script {
    function run() external {
        vm.startBroadcast();
        new MoviePoll();
        vm.stopBroadcast();
    }
}