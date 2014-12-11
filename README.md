Fukuyama Embed Simulator
========================

This program is an interactive example of my
["Pretty Good Receiving"](https://github.com/romoore/jun-simulate) project
based on Junichiro Fukuyama's algorithm for placing receivers in a
Transmit-Only wireless network.  The goal is to provide an intuition about how
the Capture Effect can be exploited to resolve collisions in wireless networks.
You can read more
about [the algorithm and project](http://romoore.github.io/jun-simulate/) 

In a nutshell, this animation shows the "capture disks" for a set of transmitters, 
assuming a few reasonable constants for signal propagation and signal-to-noise
ratios in the receiver radio.  As the transmitters "bounce" around, a grid of
possible receiver locations is updated based on the relative number of collisions that
could be resolved if that location were used.  The problem is NP-hard using the set
of Real numbers, so a grid-based approximation is used.

A [live demo](http://rsmii.com/fs/) is available on my website.
