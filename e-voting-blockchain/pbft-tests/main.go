package main

import (
	"flag"
	"fmt"
	"os"
	"strings"

	"pbft-tests/tests"
)

func main() {
	var testType = flag.String("test", "all", "Test type: genesis, consensus, or all")
	flag.Parse()

	fmt.Println("PBFT Blockchain Test Suite")
	fmt.Println("==========================")

	switch *testType {
	case "genesis":
		tests.RunGenesisTest()
	case "consensus":
		tests.RunConsensusTest()
	case "all":
		tests.RunGenesisTest()
		fmt.Println("\n" + strings.Repeat("=", 50))
		tests.RunConsensusTest()
	default:
		fmt.Printf("Unknown test type: %s\n", *testType)
		fmt.Println("Available tests: genesis, consensus, all")
		os.Exit(1)
	}
}
