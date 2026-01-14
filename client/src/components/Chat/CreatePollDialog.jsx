import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  X,
  BarChart3,
  GripVertical,
  AlertCircle,
} from "lucide-react";

const CreatePollDialog = ({ open, onOpenChange, onSubmit, conversationId }) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([
    { id: 1, text: "" },
    { id: 2, text: "" }
  ]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const MAX_OPTIONS = 10;
  const MIN_OPTIONS = 2;
  const MAX_QUESTION_LENGTH = 500;
  const MAX_OPTION_LENGTH = 200;

  const resetForm = () => {
    setQuestion("");
    setOptions([
      { id: 1, text: "" },
      { id: 2, text: "" }
    ]);
    setAllowMultiple(false);
    setIsAnonymous(false);
    setErrors({});
    setIsSubmitting(false);
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    const newId = Math.max(...options.map(o => o.id)) + 1;
    setOptions(prev => [...prev, { id: newId, text: "" }]);
    if (errors.options) setErrors(prev => ({ ...prev, options: null }));
  };

  const updateOption = (index, value) => {
    if (value.length > MAX_OPTION_LENGTH) return;
    setOptions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], text: value };
      return copy;
    });
    if (errors[`option_${index}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`option_${index}`];
        return newErrors;
      });
    }
  };

  const removeOption = (index) => {
    if (options.length <= MIN_OPTIONS) return;
    setOptions(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) newErrors.question = "Poll question is required";
    else if (trimmedQuestion.length > MAX_QUESTION_LENGTH) newErrors.question = `Question must be less than ${MAX_QUESTION_LENGTH} characters`;

    const cleanedOptions = options
      .map((o, idx) => ({ ...o, text: o.text.trim(), originalIndex: idx }))
      .filter(o => o.text.length > 0);

    if (cleanedOptions.length < MIN_OPTIONS) newErrors.options = `At least ${MIN_OPTIONS} options are required`;

    options.forEach((opt, idx) => {
      if (!opt.text.trim()) newErrors[`option_${idx}`] = "Option cannot be empty";
    });

    const optionTexts = cleanedOptions.map(o => o.text.toLowerCase());
    const duplicates = optionTexts.filter((text, idx) => optionTexts.indexOf(text) !== idx);
    if (duplicates.length > 0) newErrors.options = "Options must be unique";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const cleanedOptions = options
        .map((o, idx) => ({ id: o.id || idx + 1, text: o.text.trim() }))
        .filter(o => o.text.length > 0);

      const pollData = { question: question.trim(), options: cleanedOptions, allowMultiple, isAnonymous };

      console.log('=== CREATING POLL ===');
      console.log('Poll Data:', JSON.stringify(pollData, null, 2));
      console.log('Conversation ID:', conversationId);
      console.log('=====================');

      await onSubmit(pollData);
      resetForm();
    } catch (error) {
      console.error('Create poll error:', error);
      const serverMessage = error?.response?.data?.message || error?.response?.data?.errors || error?.message;
      if (serverMessage) {
        if (typeof serverMessage === 'object') setErrors({ submit: 'Failed to create poll: ' + JSON.stringify(serverMessage) });
        else setErrors({ submit: serverMessage });
      } else {
        setErrors({ submit: 'Failed to create poll. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuestionKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const firstOptionInput = document.getElementById('poll-option-0');
      if (firstOptionInput) firstOptionInput.focus();
    }
  };

  const handleOptionKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index === options.length - 1) {
        if (options.length < MAX_OPTIONS) {
          addOption();
          setTimeout(() => {
            const newOptionInput = document.getElementById(`poll-option-${options.length}`);
            if (newOptionInput) newOptionInput.focus();
          }, 50);
        }
      } else {
        const nextOptionInput = document.getElementById(`poll-option-${index + 1}`);
        if (nextOptionInput) nextOptionInput.focus();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Create Poll
          </DialogTitle>
          <DialogDescription>Create a poll to gather opinions from group members</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="poll-question">Question <span className="text-destructive">*</span></Label>
            <Input
              id="poll-question"
              placeholder="Ask a question..."
              value={question}
              onChange={(e) => {
                if (e.target.value.length <= MAX_QUESTION_LENGTH) {
                  setQuestion(e.target.value);
                  if (errors.question) setErrors(prev => ({ ...prev, question: null }));
                }
              }}
              onKeyDown={handleQuestionKeyDown}
              className={errors.question ? 'border-destructive' : ''}
              disabled={isSubmitting}
            />
            <div className="flex justify-between text-xs">
              {errors.question ? (
                <span className="text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.question}</span>
              ) : (<span></span>)}
              <span className="text-muted-foreground">{question.length}/{MAX_QUESTION_LENGTH}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Options <span className="text-destructive">*</span>
              <span className="text-muted-foreground text-xs ml-2">(min {MIN_OPTIONS}, max {MAX_OPTIONS})</span>
            </Label>

            <div className="space-y-2">
              {options.map((opt, index) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <div className="text-muted-foreground cursor-grab"><GripVertical className="h-4 w-4" /></div>
                  <div className="flex-1">
                    <Input
                      id={`poll-option-${index}`}
                      value={opt.text}
                      placeholder={`Option ${index + 1}`}
                      onChange={(e) => updateOption(index, e.target.value)}
                      onKeyDown={(e) => handleOptionKeyDown(e, index)}
                      className={errors[`option_${index}`] ? 'border-destructive' : ''}
                      disabled={isSubmitting}
                    />
                    {errors[`option_${index}`] && (
                      <span className="text-destructive text-xs flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{errors[`option_${index}`]}</span>
                    )}
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)} disabled={options.length <= MIN_OPTIONS || isSubmitting} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {errors.options && (
              <span className="text-destructive text-xs flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.options}</span>
            )}

            {options.length < MAX_OPTIONS && (
              <Button type="button" variant="outline" size="sm" onClick={addOption} disabled={isSubmitting} className="w-full mt-2">
                <Plus className="h-4 w-4 mr-2" />Add Option
              </Button>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <Label className="text-sm font-medium">Poll Settings</Label>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allow-multiple" className="text-sm font-normal">Allow multiple answers</Label>
                <p className="text-xs text-muted-foreground">Users can select more than one option</p>
              </div>
              <Switch id="allow-multiple" checked={allowMultiple} onCheckedChange={setAllowMultiple} disabled={isSubmitting} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="anonymous" className="text-sm font-normal">Anonymous voting</Label>
                <p className="text-xs text-muted-foreground">Hide who voted for each option</p>
              </div>
              <Switch id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} disabled={isSubmitting} />
            </div>
          </div>

          {errors.submit && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2"><AlertCircle className="h-4 w-4" />{errors.submit}</div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleCreate} disabled={isSubmitting}>
            {isSubmitting ? (<><span className="animate-spin mr-2">⏳</span>Creating...</>) : (<><BarChart3 className="h-4 w-4 mr-2" />Create Poll</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default CreatePollDialog;
// file cleaned: duplicate imports and duplicated JSX removed