# vent-optimization
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/HrGaertner/vent-optimization/deploy.yml?label=Website&style=for-the-badge)

This project develops a model enables the user to minimize the heating loss during airing but ensures to be beneath a certain humidity. This can for example be used to prevent mold. To make the model more usable there is a [WebApp](https://hrgaertner.github.io/vent-optimization/), which besides using the model also allows adapting to the local situation. Furthermore there is a [Home Assistant](https://home-assistant.io) [Integration](https://github.com/HrGaertner/HA-vent-optimization).

## The model
The model was derrived by mathematically modelling the falling humidity while venting and the fitting the remaining parameters using the least-squares-optimization method. To get this explained more in detail have a look at [the paper about it](https://github.com/HrGaertner/vent-optimization/blob/main/documentation/Paper%20about%20the%20model%20(german).pdf), sadly it is only in german.

Most of the raw data is available in the directory code [data](https://github.com/HrGaertner/vent-optimization/tree/main/data)
The code for developing and training is abailable in the directory [code](https://github.com/HrGaertner/vent-optimization/tree/main/code)


## About the project
This project started as a BLL (a project made throughout a year voluntarily which gets graded) and was then expanded to a [Jugend-Forscht](https://jugend-forscht.de) project.
