// matcher.h

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
//
// \file
// Classes to allow matching labels leaving FST states.

#ifndef FST_LIB_MATCHER_H__
#define FST_LIB_MATCHER_H__

#include <algorithm>
#include <set>

#include <fst/fst.h>

namespace fst {

// MATCHERS - these can find and iterate through requested labels at
// FST states. In the simplest form, these are just some associative
// map or search keyed on labels. More generally, they may
// implement matching special labels that represent sets of labels
// such as 'sigma' (all), 'rho' (rest), or 'phi' (fail).
// The Matcher interface is:
//
// template <class F>
// class Matcher {
//  public:
//   typedef F FST;
//   typedef F::Arc Arc;
//   typedef typename Arc::StateId StateId;
//   typedef typename Arc::Label Label;
//   typedef typename Arc::Weight Weight;
//
//   // Required constructors.
//   Matcher(const F &fst, MatchType type);
//   // If safe=true, the copy is thread-safe. See Fst<>::Copy()
//   // for further doc.
//   Matcher(const Matcher &matcher, bool safe = false);
//
//   // If safe=true, the copy is thread-safe. See Fst<>::Copy()
//   // for further doc.
//   Matcher<F> *Copy(bool safe = false) const;
//
//   // Returns the match type that can be provided (depending on
//   // compatibility of the input FST). It is either
//   // the requested match type, MATCH_NONE, or MATCH_UNKNOWN.
//   // If 'test' is false, a constant time test is performed, but
//   // MATCH_UNKNOWN may be returned. If 'test' is true,
//   // a definite answer is returned, but may involve more costly
//   // computation (e.g., visiting the Fst).
//   MatchType Type(bool test) const;
//   // Specifies the current state.
//   void SetState(StateId s);
//
//   // This finds matches to a label at the current state.
//   // Returns true if a match found. kNoLabel matches any
//   // 'non-consuming' transitions, e.g., epsilon transitions,
//   // which do not require a matching symbol.
//   bool Find(Label label);
//   // These iterate through any matches found:
//   bool Done() const;         // No more matches.
//   const A& Value() const;    // Current arc (when !Done)
//   void Next();               // Advance to next arc (when !Done)
//
//   // Return matcher FST.
//   const F& GetFst() const;
//   // This specifies the known Fst properties as viewed from this
//   // matcher. It takes as argument the input Fst's known properties.
//   uint64 Properties(uint64 props) const;
// };

// Flags used for basic matchers (see also lookahead.h).
const uint32 kMatcherFlags = 0x00000000;

// Matcher interface, templated on the Arc definition; used
// for matcher specializations that are returned by the
// InitMatcher Fst method.
template <class A>
class MatcherBase {
 public:
  typedef A Arc;
  typedef typename A::StateId StateId;
  typedef typename A::Label Label;
  typedef typename A::Weight Weight;

  virtual ~MatcherBase() {}

  virtual MatcherBase<A> *Copy(bool safe = false) const = 0;
  virtual MatchType Type(bool test) const = 0;
  void SetState(StateId s) { SetState_(s); }
  bool Find(Label label) { return Find_(label); }
  bool Done() const { return Done_(); }
  const A& Value() const { return Value_(); }
  void Next() { Next_(); }
  virtual const Fst<A> &GetFst() const = 0;
  virtual uint64 Properties(uint64 props) const = 0;
  virtual uint32 Flags() const { return 0; }
 private:
  virtual void SetState_(StateId s) = 0;
  virtual bool Find_(Label label) = 0;
  virtual bool Done_() const = 0;
  virtual const A& Value_() const  = 0;
  virtual void Next_()  = 0;
};


// A matcher that expects sorted labels on the side to be matched.
// If match_type == MATCH_INPUT, epsilons match the implicit self loop
// Arc(kNoLabel, 0, Weight::One(), current_state) as well as any
// actual epsilon transitions. If match_type == MATCH_OUTPUT, then
// Arc(0, kNoLabel, Weight::One(), current_state) is instead matched.
template <class F>
class SortedMatcher : public MatcherBase<typename F::Arc> {
 public:
  typedef F FST;
  typedef typename F::Arc Arc;
  typedef typename Arc::StateId StateId;
  typedef typename Arc::Label Label;
  typedef typename Arc::Weight Weight;

  // Labels >= binary_label will be searched for by binary search,
  // o.w. linear search is used.
  SortedMatcher(const F &fst, MatchType match_type,
                Label binary_label = 1)
      : fst_(fst.Copy()),
        s_(kNoStateId),
        aiter_(0),
        match_type_(match_type),
        binary_label_(binary_label),
        match_label_(kNoLabel),
        narcs_(0),
        loop_(kNoLabel, 0, Weight::One(), kNoStateId) {
    switch(match_type_) {
      case MATCH_INPUT:
      case MATCH_NONE:
        break;
      case MATCH_OUTPUT:
        swap(loop_.ilabel, loop_.olabel);
        break;
      default:
        LOG(FATAL) << "SortedMatcher: bad match type";
    }
  }

  SortedMatcher(const SortedMatcher<F> &matcher, bool safe = false)
      : fst_(matcher.fst_->Copy(safe)),
        s_(kNoStateId),
        aiter_(0),
        match_type_(matcher.match_type_),
        binary_label_(matcher.binary_label_),
        match_label_(kNoLabel),
        narcs_(0),
        loop_(matcher.loop_) {}

  virtual ~SortedMatcher() {
    if (aiter_)
      delete aiter_;
    delete fst_;
  }

  virtual SortedMatcher<F> *Copy(bool safe = false) const {
    return new SortedMatcher<F>(*this, safe);
  }

  virtual MatchType Type(bool test) const {
    if (match_type_ == MATCH_NONE)
      return match_type_;

    uint64 true_prop =  match_type_ == MATCH_INPUT ?
        kILabelSorted : kOLabelSorted;
    uint64 false_prop = match_type_ == MATCH_INPUT ?
        kNotILabelSorted : kNotOLabelSorted;
    uint64 props = fst_->Properties(true_prop | false_prop, test);

    if (props & true_prop)
      return match_type_;
    else if (props & false_prop)
      return MATCH_NONE;
    else
      return MATCH_UNKNOWN;
  }

  void SetState(StateId s) {
    if (s_ == s)
      return;
    s_ = s;
    if (match_type_ == MATCH_NONE)
        LOG(FATAL) << "SortedMatcher: bad match type";
    if (aiter_)
      delete aiter_;
    aiter_ = new ArcIterator<F>(*fst_, s);
    aiter_->SetFlags(kArcNoCache, kArcNoCache);
    narcs_ = internal::NumArcs(*fst_, s);
    loop_.nextstate = s;
  }

  bool Find(Label match_label);

  bool Done() const {
    if (current_loop_)
      return false;
    if (aiter_->Done())
      return true;
    Label label = match_type_ == MATCH_INPUT ?
        aiter_->Value().ilabel : aiter_->Value().olabel;
    return label != match_label_;
  }

  const Arc& Value() const {
    return current_loop_ ? loop_ : aiter_->Value();
  }

  void Next() {
    if (current_loop_)
      current_loop_ = false;
    else
      aiter_->Next();
  }

  virtual const F &GetFst() const { return *fst_; }

  virtual uint64 Properties(uint64 props) const { return props; }

 private:
  virtual void SetState_(StateId s) { SetState(s); }
  virtual bool Find_(Label label) { return Find(label); }
  virtual bool Done_() const { return Done(); }
  virtual const Arc& Value_() const { return Value(); }
  virtual void Next_() { Next(); }

  const F *fst_;
  StateId s_;                     // Current state
  ArcIterator<F> *aiter_;         // Iterator for current state
  MatchType match_type_;          // Type of match to perform
  Label binary_label_;            // Least label for binary search
  Label match_label_;             // Current label to be matched
  size_t narcs_;                  // Current state arc count
  Arc loop_;                      // For non-consuming symbols
  bool current_loop_;             // Current arc is the implicit loop

  void operator=(const SortedMatcher<F> &);  // Disallow
};

template <class F> inline
bool SortedMatcher<F>::Find(Label match_label) {
  current_loop_ = match_label == 0;
  match_label_ = match_label == kNoLabel ? 0 : match_label;
  aiter_->SetFlags(
      match_type_ == MATCH_INPUT ? kArcILabelValue : kArcOLabelValue,
      kArcValueFlags);
  if (match_label_ >= binary_label_) {
    // Binary search for match.
    size_t low = 0;
    size_t high = narcs_;
    while (low < high) {
      size_t mid = (low + high) / 2;
      aiter_->Seek(mid);
      Label label = match_type_ == MATCH_INPUT ?
          aiter_->Value().ilabel : aiter_->Value().olabel;
      if (label > match_label_) {
        high = mid;
      } else if (label < match_label_) {
        low = mid + 1;
      } else {
        // find first matching label (when non-determinism)
        for (size_t i = mid; i > low; --i) {
          aiter_->Seek(i - 1);
          label = match_type_ == MATCH_INPUT ? aiter_->Value().ilabel :
              aiter_->Value().olabel;
          if (label != match_label_) {
            aiter_->Seek(i);
            aiter_->SetFlags(kArcValueFlags, kArcValueFlags);
            return true;
          }
        }
        aiter_->SetFlags(kArcValueFlags, kArcValueFlags);
        return true;
      }
    }
    return current_loop_;
  } else {
    // Linear search for match.
    for (aiter_->Reset(); !aiter_->Done(); aiter_->Next()) {
      Label label = match_type_ == MATCH_INPUT ?
          aiter_->Value().ilabel : aiter_->Value().olabel;
      if (label == match_label_) {
        aiter_->SetFlags(kArcValueFlags, kArcValueFlags);
        return true;
      }
      if (label > match_label_)
        break;
    }
    aiter_->SetFlags(kArcValueFlags, kArcValueFlags);
    return current_loop_;
  }
}


// Specifies whether during matching we rewrite both the input and output sides.
enum MatcherRewriteMode {
  MATCHER_REWRITE_AUTO = 0,    // Rewrites both sides iff acceptor.
  MATCHER_REWRITE_ALWAYS,
  MATCHER_REWRITE_NEVER
};


// For any requested label that doesn't match at a state, this matcher
// considers all transitions that match the label 'rho_label' (rho =
// 'rest').  Each such rho transition found is returned with the
// rho_label rewritten as the requested label (both sides if an
// acceptor, or if 'rewrite_both' is true and both input and output
// labels of the found transition are 'rho_label').  If 'rho_label' is
// kNoLabel, this special matching is not done.  RhoMatcher is
// templated itself on a matcher, which is used to perform the
// underlying matching.  By default, the underlying matcher is
// constructed by RhoMatcher.  The user can instead pass in this
// object; in that case, RhoMatcher takes its ownership.
template <class M>
class RhoMatcher : public MatcherBase<typename M::Arc> {
 public:
  typedef typename M::FST FST;
  typedef typename M::Arc Arc;
  typedef typename Arc::StateId StateId;
  typedef typename Arc::Label Label;
  typedef typename Arc::Weight Weight;

  RhoMatcher(const FST &fst,
             MatchType match_type,
             Label rho_label = kNoLabel,
             MatcherRewriteMode rewrite_mode = MATCHER_REWRITE_AUTO,
             M *matcher = 0)
      : matcher_(matcher ? matcher : new M(fst, match_type)),
        match_type_(match_type),
        rho_label_(rho_label) {
    if (match_type == MATCH_BOTH)
      LOG(FATAL) << "RhoMatcher: bad match type";
    if (rho_label == 0)
      LOG(FATAL) << "RhoMatcher: 0 cannot be used as rho_label";

    if (rewrite_mode == MATCHER_REWRITE_AUTO)
      rewrite_both_ = fst.Properties(kAcceptor, true);
    else if (rewrite_mode == MATCHER_REWRITE_ALWAYS)
      rewrite_both_ = true;
    else
      rewrite_both_ = false;
  }

  RhoMatcher(const RhoMatcher<M> &matcher, bool safe = false)
      : matcher_(new M(*matcher.matcher_, safe)),
        match_type_(matcher.match_type_),
        rho_label_(matcher.rho_label_),
        rewrite_both_(matcher.rewrite_both_) {}

  virtual ~RhoMatcher() {
    delete matcher_;
  }

  virtual RhoMatcher<M> *Copy(bool safe = false) const {
    return new RhoMatcher<M>(*this, safe);
  }

  virtual MatchType Type(bool test) const { return matcher_->Type(test); }

  void SetState(StateId s) {
    matcher_->SetState(s);
    has_rho_ = rho_label_ != kNoLabel;
  }

  bool Find(Label match_label) {
    if (match_label == rho_label_ && rho_label_ != kNoLabel) {
      LOG(FATAL) << "RhoMatcher::Find: bad label (rho)";
    }
    if (matcher_->Find(match_label)) {
      rho_match_ = kNoLabel;
      return true;
    } else if (has_rho_ && match_label != 0 && match_label != kNoLabel &&
               (has_rho_ = matcher_->Find(rho_label_))) {
      rho_match_ = match_label;
      return true;
    } else {
      return false;
    }
  }

  bool Done() const { return matcher_->Done(); }

  const Arc& Value() const {
    if (rho_match_ == kNoLabel) {
      return matcher_->Value();
    } else {
      rho_arc_ = matcher_->Value();
      if (rewrite_both_) {
        if (rho_arc_.ilabel == rho_label_)
          rho_arc_.ilabel = rho_match_;
        if (rho_arc_.olabel == rho_label_)
          rho_arc_.olabel = rho_match_;
      } else if (match_type_ == MATCH_INPUT) {
        rho_arc_.ilabel = rho_match_;
      } else {
        rho_arc_.olabel = rho_match_;
      }
      return rho_arc_;
    }
  }

  void Next() { matcher_->Next(); }

  virtual const FST &GetFst() const { return matcher_->GetFst(); }

  virtual uint64 Properties(uint64 props) const;

 private:
  virtual void SetState_(StateId s) { SetState(s); }
  virtual bool Find_(Label label) { return Find(label); }
  virtual bool Done_() const { return Done(); }
  virtual const Arc& Value_() const { return Value(); }
  virtual void Next_() { Next(); }

  M *matcher_;
  MatchType match_type_;  // Type of match requested
  Label rho_label_;       // Label that represents the rho transition
  bool rewrite_both_;     // Rewrite both sides when both are 'rho_label_'
  bool has_rho_;          // Are there possibly rhos at the current state?
  Label rho_match_;       // Current label that matches rho transition
  mutable Arc rho_arc_;   // Arc to return when rho match

  void operator=(const RhoMatcher<M> &);  // Disallow
};

template <class M> inline
uint64 RhoMatcher<M>::Properties(uint64 props) const {
  if (match_type_ == MATCH_NONE) {
    return props;
  } else if (match_type_ == MATCH_INPUT) {
    if (rewrite_both_) {
      return props & ~(kODeterministic | kNonODeterministic | kString |
                       kILabelSorted | kNotILabelSorted |
                       kOLabelSorted | kNotOLabelSorted);
    } else {
      return props & ~(kODeterministic | kAcceptor | kString |
                       kILabelSorted | kNotILabelSorted);
    }
  } else if (match_type_ == MATCH_OUTPUT) {
    if (rewrite_both_) {
      return props & ~(kIDeterministic | kNonIDeterministic | kString |
                       kILabelSorted | kNotILabelSorted |
                       kOLabelSorted | kNotOLabelSorted);
    } else {
      return props & ~(kIDeterministic | kAcceptor | kString |
                       kOLabelSorted | kNotOLabelSorted);
    }
  } else {
    LOG(FATAL) << "RhoMatcher::Properties: Invalid match type: "
               << match_type_;
    return 0;
  }
}


// For any requested label, this matcher considers all transitions
// that match the label 'sigma_label' (sigma = "any"), and this in
// additions to transitions with the requested label.  Each such sigma
// transition found is returned with the sigma_label rewritten as the
// requested label (both sides if an acceptor, or if 'rewrite_both' is
// true and both input and output labels of the found transition are
// 'sigma_label').  If 'sigma_label' is kNoLabel, this special
// matching is not done.  SigmaMatcher is templated itself on a
// matcher, which is used to perform the underlying matching.  By
// default, the underlying matcher is constructed by SigmaMatcher.
// The user can instead pass in this object; in that case,
// SigmaMatcher takes its ownership.
template <class M>
class SigmaMatcher : public MatcherBase<typename M::Arc> {
 public:
  typedef typename M::FST FST;
  typedef typename M::Arc Arc;
  typedef typename Arc::StateId StateId;
  typedef typename Arc::Label Label;
  typedef typename Arc::Weight Weight;

  SigmaMatcher(const FST &fst,
               MatchType match_type,
               Label sigma_label = kNoLabel,
               MatcherRewriteMode rewrite_mode = MATCHER_REWRITE_AUTO,
               M *matcher = 0)
      : matcher_(matcher ? matcher : new M(fst, match_type)),
        match_type_(match_type),
        sigma_label_(sigma_label) {
    if (match_type == MATCH_BOTH)
      LOG(FATAL) << "SigmaMatcher: bad match type";
    if (sigma_label == 0)
      LOG(FATAL) << "SigmaMatcher: 0 cannot be used as sigma_label";

    if (rewrite_mode == MATCHER_REWRITE_AUTO)
      rewrite_both_ = fst.Properties(kAcceptor, true);
    else if (rewrite_mode == MATCHER_REWRITE_ALWAYS)
      rewrite_both_ = true;
    else
      rewrite_both_ = false;
  }

  SigmaMatcher(const SigmaMatcher<M> &matcher, bool safe = false)
      : matcher_(new M(*matcher.matcher_, safe)),
        match_type_(matcher.match_type_),
        sigma_label_(matcher.sigma_label_),
        rewrite_both_(matcher.rewrite_both_) {}

  virtual ~SigmaMatcher() {
    delete matcher_;
  }

  virtual SigmaMatcher<M> *Copy(bool safe = false) const {
    return new SigmaMatcher<M>(*this, safe);
  }

  virtual MatchType Type(bool test) const { return matcher_->Type(test); }

  void SetState(StateId s) {
    matcher_->SetState(s);
    has_sigma_ =
        sigma_label_ != kNoLabel ? matcher_->Find(sigma_label_) : false;
  }

  bool Find(Label match_label) {
    match_label_ = match_label;
    if (match_label == sigma_label_ && sigma_label_ != kNoLabel) {
      LOG(FATAL) << "SigmaMatcher::Find: bad label (sigma)";
    }
    if (matcher_->Find(match_label)) {
      sigma_match_ = kNoLabel;
      return true;
    } else if (has_sigma_ && match_label != 0 && match_label != kNoLabel &&
               matcher_->Find(sigma_label_)) {
      sigma_match_ = match_label;
      return true;
    } else {
      return false;
    }
  }

  bool Done() const {
    return matcher_->Done();
  }

  const Arc& Value() const {
    if (sigma_match_ == kNoLabel) {
      return matcher_->Value();
    } else {
      sigma_arc_ = matcher_->Value();
      if (rewrite_both_) {
        if (sigma_arc_.ilabel == sigma_label_)
          sigma_arc_.ilabel = sigma_match_;
        if (sigma_arc_.olabel == sigma_label_)
          sigma_arc_.olabel = sigma_match_;
      } else if (match_type_ == MATCH_INPUT) {
        sigma_arc_.ilabel = sigma_match_;
      } else {
        sigma_arc_.olabel = sigma_match_;
      }
      return sigma_arc_;
    }
  }

  void Next() {
    matcher_->Next();
    if (matcher_->Done() && has_sigma_ && (sigma_match_ == kNoLabel) &&
        (match_label_ > 0)) {
      matcher_->Find(sigma_label_);
      sigma_match_ = match_label_;
    }
  }

  virtual const FST &GetFst() const { return matcher_->GetFst(); }

  virtual uint64 Properties(uint64 props) const;

private:
  virtual void SetState_(StateId s) { SetState(s); }
  virtual bool Find_(Label label) { return Find(label); }
  virtual bool Done_() const { return Done(); }
  virtual const Arc& Value_() const { return Value(); }
  virtual void Next_() { Next(); }

  M *matcher_;
  MatchType match_type_;   // Type of match requested
  Label sigma_label_;      // Label that represents the sigma transition
  bool rewrite_both_;      // Rewrite both sides when both are 'sigma_label_'
  bool has_sigma_;         // Are there sigmas at the current state?
  Label sigma_match_;      // Current label that matches sigma transition
  mutable Arc sigma_arc_;  // Arc to return when sigma match
  Label match_label_;      // Label being matched

  void operator=(const SigmaMatcher<M> &);  // disallow
};

template <class M> inline
uint64 SigmaMatcher<M>::Properties(uint64 props) const {
  if (match_type_ == MATCH_NONE) {
    return props;
  } else if (rewrite_both_) {
    return props & ~(kIDeterministic | kNonIDeterministic |
                     kODeterministic | kNonODeterministic |
                     kILabelSorted | kNotILabelSorted |
                     kOLabelSorted | kNotOLabelSorted |
                     kString);
  } else if (match_type_ == MATCH_INPUT) {
    return props & ~(kIDeterministic | kNonIDeterministic |
                     kODeterministic | kNonODeterministic |
                     kILabelSorted | kNotILabelSorted |
                     kString | kAcceptor);
  } else if (match_type_ == MATCH_OUTPUT) {
    return props & ~(kIDeterministic | kNonIDeterministic |
                     kODeterministic | kNonODeterministic |
                     kOLabelSorted | kNotOLabelSorted |
                     kString | kAcceptor);
  } else {
    LOG(FATAL) << "SigmaMatcher::Properties: Invalid match type: "
               << match_type_;
    return 0;
  }
}


// For any requested label that doesn't match at a state, this matcher
// considers the *unique* transition that match the label 'phi_label'
// (phi = 'fail'), and recursively look for a match at its
// destination.  When 'phi_loop' is true, if no match is found but a
// phi self-loop is found, then the phi transition found is returned
// with the phi_label rewritten as the requested label (both sides if
// an acceptor, or if 'rewrite_both' is true and both input and output
// labels of the found transition are 'phi_label').  If 'phi_label' is
// kNoLabel, this special matching is not done.  PhiMatcher is
// templated itself on a matcher, which is used to perform the
// underlying matching.  By default, the underlying matcher is
// constructed by PhiMatcher. The user can instead pass in this
// object; in that case, PhiMatcher takes its ownership.
// Warning: phi non-determinism not supported (for simplicity).
template <class M>
class PhiMatcher : public MatcherBase<typename M::Arc> {
 public:
  typedef typename M::FST FST;
  typedef typename M::Arc Arc;
  typedef typename Arc::StateId StateId;
  typedef typename Arc::Label Label;
  typedef typename Arc::Weight Weight;

  PhiMatcher(const FST &fst,
             MatchType match_type,
             Label phi_label = kNoLabel,
             bool phi_loop = true,
             MatcherRewriteMode rewrite_mode = MATCHER_REWRITE_AUTO,
             M *matcher = 0)
      : matcher_(matcher ? matcher : new M(fst, match_type)),
        match_type_(match_type),
        phi_label_(phi_label),
        state_(kNoStateId),
        phi_loop_(phi_loop) {
    if (match_type == MATCH_BOTH)
      LOG(FATAL) << "PhiMatcher: bad match type";
    if (phi_label == 0)
      LOG(FATAL) << "PhiMatcher: 0 cannot be used as phi_label";

    if (rewrite_mode == MATCHER_REWRITE_AUTO)
      rewrite_both_ = fst.Properties(kAcceptor, true);
    else if (rewrite_mode == MATCHER_REWRITE_ALWAYS)
      rewrite_both_ = true;
    else
      rewrite_both_ = false;
   }

  PhiMatcher(const PhiMatcher<M> &matcher, bool safe = false)
      : matcher_(new M(*matcher.matcher_, safe)),
        match_type_(matcher.match_type_),
        phi_label_(matcher.phi_label_),
        rewrite_both_(matcher.rewrite_both_),
        state_(kNoStateId),
        phi_loop_(matcher.phi_loop_) {}

  virtual ~PhiMatcher() {
    delete matcher_;
  }

  virtual PhiMatcher<M> *Copy(bool safe = false) const {
    return new PhiMatcher<M>(*this, safe);
  }

  virtual MatchType Type(bool test) const { return matcher_->Type(test); }

  void SetState(StateId s) {
    matcher_->SetState(s);
    state_ = s;
    has_phi_ = phi_label_ != kNoLabel;
  }

  bool Find(Label match_label);

  bool Done() const { return matcher_->Done(); }

  const Arc& Value() const {
    if ((phi_match_ == kNoLabel) && (phi_weight_ == Weight::One())) {
      return matcher_->Value();
    } else {
      phi_arc_ = matcher_->Value();
      phi_arc_.weight = Times(phi_weight_, phi_arc_.weight);
      if (phi_match_ != kNoLabel) {
        if (rewrite_both_) {
          if (phi_arc_.ilabel == phi_label_)
            phi_arc_.ilabel = phi_match_;
          if (phi_arc_.olabel == phi_label_)
            phi_arc_.olabel = phi_match_;
        } else if (match_type_ == MATCH_INPUT) {
          phi_arc_.ilabel = phi_match_;
        } else {
          phi_arc_.olabel = phi_match_;
        }
      }
      return phi_arc_;
    }
  }

  void Next() { matcher_->Next(); }

  virtual const FST &GetFst() const { return matcher_->GetFst(); }

  virtual uint64 Properties(uint64 props) const;

private:
  virtual void SetState_(StateId s) { SetState(s); }
  virtual bool Find_(Label label) { return Find(label); }
  virtual bool Done_() const { return Done(); }
  virtual const Arc& Value_() const { return Value(); }
  virtual void Next_() { Next(); }

  M *matcher_;
  MatchType match_type_;  // Type of match requested
  Label phi_label_;       // Label that represents the phi transition
  bool rewrite_both_;     // Rewrite both sides when both are 'phi_label_'
  bool has_phi_;          // Are there possibly phis at the current state?
  Label phi_match_;       // Current label that matches phi loop
  mutable Arc phi_arc_;   // Arc to return
  StateId state_;         // State where looking for matches
  Weight phi_weight_;     // Product of the weights of phi transitions taken
  bool phi_loop_;         // When true, phi self-loop are allowed and treated
                          // as rho (required for Aho-Corasick)

  void operator=(const PhiMatcher<M> &);  // disallow
};

template <class M> inline
bool PhiMatcher<M>::Find(Label match_label) {
  if (match_label == phi_label_ && phi_label_ != kNoLabel) {
    LOG(FATAL) << "PhiMatcher::Find: bad label (phi)";
  }
  matcher_->SetState(state_);
  phi_match_ = kNoLabel;
  phi_weight_ = Weight::One();
  if (!has_phi_ || match_label == 0 || match_label == kNoLabel)
    return matcher_->Find(match_label);
  StateId state = state_;
  while (!matcher_->Find(match_label)) {
    if (!matcher_->Find(phi_label_))
      return false;
    if (phi_loop_ && matcher_->Value().nextstate == state) {
      phi_match_ = match_label;
      return true;
    }
    phi_weight_ = Times(phi_weight_, matcher_->Value().weight);
    state = matcher_->Value().nextstate;
    matcher_->Next();
    if (!matcher_->Done())
      LOG(FATAL) << "PhiMatcher: phi non-determinism not supported";
    matcher_->SetState(state);
  }
  return true;
}

template <class M> inline
uint64 PhiMatcher<M>::Properties(uint64 props) const {
  if (match_type_ == MATCH_NONE) {
    return props;
  } else if (match_type_ == MATCH_INPUT) {
    if (rewrite_both_) {
      return props & ~(kODeterministic | kNonODeterministic | kString |
                       kILabelSorted | kNotILabelSorted |
                       kOLabelSorted | kNotOLabelSorted);
    } else {
      return props & ~(kODeterministic | kAcceptor | kString |
                       kILabelSorted | kNotILabelSorted |
                       kOLabelSorted | kNotOLabelSorted);
    }
  } else if (match_type_ == MATCH_OUTPUT) {
    if (rewrite_both_) {
      return props & ~(kIDeterministic | kNonIDeterministic | kString |
                       kILabelSorted | kNotILabelSorted |
                       kOLabelSorted | kNotOLabelSorted);
    } else {
      return props & ~(kIDeterministic | kAcceptor | kString |
                       kILabelSorted | kNotILabelSorted |
                       kOLabelSorted | kNotOLabelSorted);
    }
  } else {
    LOG(FATAL) << "PhiMatcher::Properties: Invalid match type: "
               << match_type_;
    return 0;
  }
}


//
// MULTI-EPS MATCHER FLAGS
//

// Return multi-epsilon arcs for Find(kNoLabel).
const uint32 kMultiEpsList =  0x00000001;

// Return a kNolabel loop for Find(multi_eps).
const uint32 kMultiEpsLoop =  0x00000002;

// MultiEpsMatcher: allows treating multiple non-0 labels as
// non-consuming labels in addition to 0 that is always
// non-consuming. Precise behavior controlled by 'flags' argument. By
// default, the underlying matcher is constructed by
// MultiEpsMatcher. The user can instead pass in this object; in that
// case, MultiEpsMatcher takes its ownership iff 'own_matcher' is
// true.
template <class M>
class MultiEpsMatcher {
 public:
  typedef typename M::FST FST;
  typedef typename M::Arc Arc;
  typedef typename Arc::StateId StateId;
  typedef typename Arc::Label Label;
  typedef typename Arc::Weight Weight;

  MultiEpsMatcher(const FST &fst, MatchType match_type,
                  uint32 flags = (kMultiEpsLoop | kMultiEpsList),
                  M *matcher = 0, bool own_matcher = true)
      : matcher_(matcher ? matcher : new M(fst, match_type)),
        flags_(flags),
        own_matcher_(matcher ?  own_matcher : true) {
    if (match_type == MATCH_INPUT) {
      loop_.ilabel = kNoLabel;
      loop_.olabel = 0;
    } else {
      loop_.ilabel = 0;
      loop_.olabel = kNoLabel;
    }
    loop_.weight = Weight::One();
    loop_.nextstate = kNoStateId;
  }

  MultiEpsMatcher(const MultiEpsMatcher<M> &matcher, bool safe = false)
      : matcher_(new M(*matcher.matcher_, safe)),
        flags_(matcher.flags_),
        own_matcher_(true),
        multi_eps_labels_(matcher.multi_eps_labels_),
        loop_(matcher.loop_) {
    loop_.nextstate = kNoStateId;
  }

  ~MultiEpsMatcher() {
    if (own_matcher_)
      delete matcher_;
  }

  MultiEpsMatcher<M> *Copy(bool safe = false) const {
    return new MultiEpsMatcher<M>(*this, safe);
  }

  MatchType Type(bool test) const { return matcher_->Type(test); }

  void SetState(StateId s) {
    matcher_->SetState(s);
    loop_.nextstate = s;
  }

  bool Find(Label match_label);

  bool Done() const {
    return done_;
  }

  const Arc& Value() const {
    return current_loop_ ? loop_ : matcher_->Value();
  }

  void Next() {
    if (!current_loop_) {
      matcher_->Next();
      done_ = matcher_->Done();
      if (done_ && multi_eps_iter_ != multi_eps_labels_.End()) {
        ++multi_eps_iter_;
        while ((multi_eps_iter_ != multi_eps_labels_.End()) &&
               !matcher_->Find(*multi_eps_iter_))
          ++multi_eps_iter_;
        if (multi_eps_iter_ != multi_eps_labels_.End())
          done_ = false;
        else
          done_ = !matcher_->Find(kNoLabel);

      }
    } else {
      done_ = true;
    }
  }

  const FST &GetFst() const { return matcher_->GetFst(); }

  uint64 Properties(uint64 props) const { return props; }

  uint32 Flags() const { return matcher_->Flags(); }

  void AddMultiEpsLabel(Label label) {
    if (label == 0)
      LOG(FATAL) << "MultiEpsMatcher: Bad multi-eps label: 0";
    multi_eps_labels_.Insert(label);
  }

  void ClearMultiEpsLabels() {
    multi_eps_labels_.Clear();
  }

private:
  // Specialized for 'set' - log lookup
  bool IsMultiEps(const set<Label> &multi_eps_labels, Label label) const {
    return multi_eps_labels.Find(label) != multi_eps_labels.end();
  }

  M *matcher_;
  uint32 flags_;
  bool own_matcher_;             // Does this class delete the matcher?

  // Multi-eps label set
  CompactSet<Label, kNoLabel> multi_eps_labels_;
  typename CompactSet<Label, kNoLabel>::const_iterator multi_eps_iter_;

  bool current_loop_;            // Current arc is the implicit loop
  mutable Arc loop_;             // For non-consuming symbols
  bool done_;                    // Matching done

  void operator=(const MultiEpsMatcher<M> &);  // Disallow
};

template <class M> inline
bool MultiEpsMatcher<M>::Find(Label match_label) {
  multi_eps_iter_ = multi_eps_labels_.End();
  current_loop_ = false;
  bool ret;
  if (match_label == 0) {
    ret = matcher_->Find(0);
  } else if (match_label == kNoLabel) {
    if (flags_ & kMultiEpsList) {
      // return all non-consuming arcs (incl. epsilon)
      multi_eps_iter_ = multi_eps_labels_.Begin();
      while ((multi_eps_iter_ != multi_eps_labels_.End()) &&
             !matcher_->Find(*multi_eps_iter_))
        ++multi_eps_iter_;
      if (multi_eps_iter_ != multi_eps_labels_.End())
        ret = true;
      else
        ret = matcher_->Find(kNoLabel);
    } else {
      // return all epsilon arcs
      ret = matcher_->Find(kNoLabel);
    }
  } else if ((flags_ & kMultiEpsLoop) &&
             multi_eps_labels_.Find(match_label) != multi_eps_labels_.End()) {
    // return 'implicit' loop
    current_loop_ = true;
    ret = true;
  } else {
    ret = matcher_->Find(match_label);
  }
  done_ = !ret;
  return ret;
}


// Generic matcher, templated on the FST definition
// - a wrapper around pointer to specific one.
// Here is a typical use: \code
//   Matcher<StdFst> matcher(fst, MATCH_INPUT);
//   matcher.SetState(state);
//   if (matcher.Find(label))
//     for (; !matcher.Done(); matcher.Next()) {
//       StdArc &arc = matcher.Value();
//       ...
//     } \endcode
template <class F>
class Matcher {
 public:
  typedef F FST;
  typedef typename F::Arc Arc;
  typedef typename Arc::StateId StateId;
  typedef typename Arc::Label Label;
  typedef typename Arc::Weight Weight;

  Matcher(const F &fst, MatchType match_type) {
    base_ = fst.InitMatcher(match_type);
    if (!base_)
      base_ = new SortedMatcher<F>(fst, match_type);
  }

  Matcher(const Matcher<F> &matcher, bool safe = false) {
    base_ = matcher.base_->Copy(safe);
  }

  // Takes ownership of the provided matcher
  Matcher(MatcherBase<Arc>* base_matcher) { base_ = base_matcher; }

  ~Matcher() { delete base_; }

  Matcher<F> *Copy(bool safe = false) const {
    return new Matcher<F>(*this, safe);
  }

  MatchType Type(bool test) const { return base_->Type(test); }
  void SetState(StateId s) { base_->SetState(s); }
  bool Find(Label label) { return base_->Find(label); }
  bool Done() const { return base_->Done(); }
  const Arc& Value() const { return base_->Value(); }
  void Next() { base_->Next(); }
  const F &GetFst() const { return static_cast<const F &>(base_->GetFst()); }
  uint64 Properties(uint64 props) const { return base_->Properties(props); }
  uint32 Flags() const { return base_->Flags() & kMatcherFlags; }

 private:
  MatcherBase<Arc> *base_;

  void operator=(const Matcher<Arc> &);  // disallow
};

}  // namespace fst



#endif  // FST_LIB_MATCHER_H__
