// fstprune.cc

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Copyright 2005-2010 Google, Inc.
// Author: allauzen@google.com (Cyril Allauzen)
// Modified: jpr@google.com (Jake Ratkiewicz) to use FstClass
//
// \file
// Prunes states and arcs of an FST w.r.t. the shortest path weight.
//

#include <fst/script/prune.h>

DEFINE_double(delta, fst::kDelta, "Comparison/quantization delta");
DEFINE_int64(nstate, fst::kNoStateId, "State number parameter");
DEFINE_string(weight, "", "Weight parameter");
DEFINE_string(arc_filter, "any", "Arc filter: one of :"
              " \"any\", \"epsilon\", \"iepsilon\", \"oepsilon\"");


int main(int argc, char **argv) {
  namespace s = fst::script;
  using fst::script::FstClass;
  using fst::script::MutableFstClass;
  using fst::script::VectorFstClass;
  using fst::script::WeightClass;

  string usage = "Prunes states and arcs of an FST.\n\n  Usage: ";
  usage += argv[0];
  usage += " [in.fst [out.fst]]\n";

  std::set_new_handler(FailedNewHandler);
  SetFlags(usage.c_str(), &argc, &argv, true);
  if (argc > 3) {
    ShowUsage();
    return 1;
  }

  string in_name = (argc > 1 && strcmp(argv[1], "-") != 0) ? argv[1] : "";
  string out_name = argc > 2 ? argv[2] : "";

  FstClass *ifst = FstClass::Read(in_name);
  if (!ifst) return 1;

  MutableFstClass *ofst = 0;
  if (ifst->Properties(fst::kMutable, false)) {
    ofst = static_cast<MutableFstClass *>(ifst);
  } else {
    ofst = new VectorFstClass(*ifst);
    delete ifst;
  }

  WeightClass weight_threshold = FLAGS_weight.empty() ?
      WeightClass::Zero() :
      WeightClass(ifst->WeightType(), FLAGS_weight);

  s::ArcFilterType arc_filter;
  if (FLAGS_arc_filter == "any") {
    arc_filter = s::ANY_ARC_FILTER;
  } else if (FLAGS_arc_filter == "epsilon") {
    arc_filter = s::EPSILON_ARC_FILTER;
  } else if (FLAGS_arc_filter == "iepsilon") {
    arc_filter = s::INPUT_EPSILON_ARC_FILTER;
  } else if (FLAGS_arc_filter == "oepsilon") {
    arc_filter = s::OUTPUT_EPSILON_ARC_FILTER;
  } else {
    LOG(FATAL) << "Unknown arc filter type: " << FLAGS_arc_filter;
  }

  s::PruneOptions opts(weight_threshold, FLAGS_nstate, arc_filter,
                       0, FLAGS_delta);

  s::Prune(ofst, opts);

  ofst->Write(out_name);

  return 0;
}
