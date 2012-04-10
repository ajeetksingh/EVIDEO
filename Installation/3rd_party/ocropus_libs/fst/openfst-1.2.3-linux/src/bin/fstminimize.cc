// fstminimize.cc

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
// Author: riley@google.com (Michael Riley)
// Modified: jpr@google.com (Jake Ratkiewicz) to use FstClass
//
// \file
// Minimizes a deterministic FSA.
//

#include <fst/script/minimize.h>

DEFINE_double(delta, fst::kDelta, "Comparison/quantization delta");


int main(int argc, char **argv) {
  namespace s = fst::script;
  using fst::script::FstClass;
  using fst::script::MutableFstClass;
  using fst::script::VectorFstClass;

  string usage = "Minimizes a deterministic FST.\n\n  Usage: ";
  usage += argv[0];
  usage += " [in.fst [out1.fst [out2.fst]]]\n";

  std::set_new_handler(FailedNewHandler);
  SetFlags(usage.c_str(), &argc, &argv, true);
  if (argc > 4) {
    ShowUsage();
    return 1;
  }

  string in_name = (argc > 1 && strcmp(argv[1], "-") != 0) ? argv[1] : "";
  string out1_name = (argc > 2 && strcmp(argv[2], "-") != 0) ? argv[2] : "";
  string out2_name = (argc > 3 && strcmp(argv[3], "-") != 0) ? argv[3] : "";

  if (out1_name.empty() && out2_name.empty() && argc > 3) {
    LOG(ERROR) << "Both outputs can't be standard out.";
    return 1;
  }

  FstClass *ifst = FstClass::Read(in_name);
  if (!ifst) return 1;

  MutableFstClass *ofst1 = 0;
  if (ifst->Properties(fst::kMutable, false)) {
    ofst1 = static_cast<MutableFstClass *>(ifst);
  } else {
    ofst1 = new VectorFstClass(*ifst);
    delete ifst;
  }

  MutableFstClass *ofst2 = argc > 3 ?
      new VectorFstClass(ifst->ArcType()) : 0;

  s::Minimize(ofst1, ofst2, FLAGS_delta);

  ofst1->Write(out1_name);
  if (ofst2) {
    ofst2->Write(out2_name);
  }

  return 0;
}
