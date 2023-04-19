#!/bin/bash

HOMEBREW_NO_INSTALL_CLEANUP=true brew install --build-from-source ./odin.rb
ls -l /home/linuxbrew/.linuxbrew/Cellar/odin/2023-04
which odin
