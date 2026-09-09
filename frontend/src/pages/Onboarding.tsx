import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Loader2 } from "lucide-react";
import { uploadResume, updateProfile } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 State
  const [status, setStatus] = useState("Student");
  const [desiredRole, setDesiredRole] = useState("");
  const [experience, setExperience] = useState(0);

  // Step 2 State
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [preferredLocation, setPreferredLocation] = useState("Remote");
  const [expectedSalary, setExpectedSalary] = useState("");

  // Step 3 State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const addSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newSkill.trim()) {
      if (!skills.includes(newSkill.trim())) {
        setSkills([...skills, newSkill.trim()]);
      }
      setNewSkill("");
      e.preventDefault();
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    // Final submission
    setLoading(true);
    try {
      // Update user profile
      await updateProfile({
        profile: {
          currentRole: status,
          experienceYears: experience,
          skills: skills,
          preferredRoles: [desiredRole],
          preferredLocations: [preferredLocation],
          expectedSalary: expectedSalary
        }
      });

      // Upload resume if selected
      if (selectedFile) {
        await uploadResume(selectedFile);
      }

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-[#12121A] border border-[#2A2A3E] rounded-3xl p-8 lg:p-12">
        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? "bg-[#6C63FF]" : "bg-[#2A2A3E]"}`}>1</div>
              <span className={step >= 1 ? "text-white" : "text-[#A0A0B8]"}>Your Role</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 2 ? "bg-[#6C63FF]" : "bg-[#2A2A3E]"}`}></div>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? "bg-[#6C63FF]" : "bg-[#2A2A3E]"}`}>2</div>
              <span className={step >= 2 ? "text-white" : "text-[#A0A0B8]"}>Your Skills</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 3 ? "bg-[#6C63FF]" : "bg-[#2A2A3E]"}`}></div>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? "bg-[#6C63FF]" : "bg-[#2A2A3E]"}`}>3</div>
              <span className={step >= 3 ? "text-white" : "text-[#A0A0B8]"}>Resume</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-8">
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Your Role</h1>
                <p className="text-[#A0A0B8]">Tell us about your current status and goals</p>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium">Current Status</label>
                <div className="grid grid-cols-3 gap-4">
                  {["Student", "Fresher", "Working Professional"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`p-4 rounded-xl border transition-all ${status === s ? "border-[#6C63FF] bg-[#6C63FF]/10" : "border-[#2A2A3E] hover:border-[#3A3A5E]"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Desired Role</label>
                <input
                  type="text"
                  value={desiredRole}
                  onChange={(e) => setDesiredRole(e.target.value)}
                  placeholder="React Developer, Full Stack Engineer, Data Engineer..."
                  className="w-full px-4 py-3 bg-[#1A1A2E] border border-[#2A2A3E] rounded-xl focus:outline-none focus:border-[#6C63FF] transition-colors"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Years of Experience</label>
                  <span className="text-[#6C63FF] font-bold">{experience} years</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={experience}
                  onChange={(e) => setExperience(Number(e.target.value))}
                  className="w-full accent-[#6C63FF]"
                />
                <div className="flex justify-between text-xs text-[#A0A0B8]">
                  <span>0</span>
                  <span>5</span>
                  <span>10+</span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Your Skills</h1>
                <p className="text-[#A0A0B8]">What are you good at?</p>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium">Skills (type & press enter)</label>
                <div className="flex flex-wrap gap-2 p-3 bg-[#1A1A2E] border border-[#2A2A3E] rounded-xl min-h-[80px]">
                  {skills.map((skill) => (
                    <span key={skill} className="bg-[#6C63FF]/20 text-[#6C63FF] px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="hover:text-white">×</button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={addSkill}
                    placeholder="Add skill..."
                    className="flex-1 bg-transparent outline-none min-w-[120px]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Preferred Location</label>
                <select
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1A1A2E] border border-[#2A2A3E] rounded-xl focus:outline-none focus:border-[#6C63FF] transition-colors"
                >
                  {["Remote", "Bangalore", "Mumbai", "Delhi", "Any"].map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Expected Salary/Stipend</label>
                <input
                  type="text"
                  value={expectedSalary}
                  onChange={(e) => setExpectedSalary(e.target.value)}
                  placeholder="₹5LPA - ₹10LPA or ₹15k/month"
                  className="w-full px-4 py-3 bg-[#1A1A2E] border border-[#2A2A3E] rounded-xl focus:outline-none focus:border-[#6C63FF] transition-colors"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Upload Resume</h1>
                <p className="text-[#A0A0B8]">Let our AI analyze your resume</p>
              </div>

              <div
                onClick={() => document.getElementById("resume-upload")?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${selectedFile ? "border-[#00D4AA] bg-[#00D4AA]/10" : "border-[#2A2A3E] hover:border-[#6C63FF]"}`}
              >
                <input
                  id="resume-upload"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 mx-auto text-[#00D4AA]" />
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-[#A0A0B8]">Click to change</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 mx-auto text-[#A0A0B8]" />
                    <p className="font-medium">Drag & drop your PDF here</p>
                    <p className="text-sm text-[#A0A0B8]">or click to browse</p>
                  </div>
                )}
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-[#2A2A3E] rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#6C63FF] to-[#00D4AA] h-2 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}

              <button
                onClick={() => navigate("/dashboard")}
                className="text-[#A0A0B8] hover:text-white text-sm"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-10">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 border border-[#2A2A3E] rounded-xl font-semibold hover:bg-[#1A1A2E] transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={loading}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${step === 3 ? "bg-gradient-to-r from-[#6C63FF] to-[#00D4AA]" : "bg-gradient-to-r from-[#6C63FF] to-[#8B82FF]"} hover:shadow-lg hover:shadow-[#6C63FF]/30 disabled:opacity-70`}
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? "Saving..." : step === 3 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
