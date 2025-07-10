"use client"
import { useUser } from "@/src/lib/features/auth/hooks/use-user"
import { useStore } from "@/src/lib/store/counter-store";
import { useState } from "react";

export const Home = () => {
    
    const { user } = useUser()
    const { count, increment, decrement, reset } = useStore();
    const [text, setText] = useState("");

    const prepend = (char: string) => setText(prev => char + prev);
    const append = (char: string) => setText(prev => prev + char);
    const clear = () => setText("");

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="p-8 bg-background min-h-screen font-primary dark:bg-orange-500">
            <h1 className="text-heading font-primary mb-6 text-text">User: {user.email}</h1>
            <section className="space-y-8">
                <div>
                    <h2 className="text-subheading mb-4">Text Demo</h2>
                    <div className="p-6 bg-primary shadow-primary rounded">
                        <div className="flex items-center justify-center space-x-4">
                            <button 
                                onClick={() => prepend("A")}
                                className="px-4 py-2 bg-white text-primary rounded hover:bg-gray-100"
                            >
                                Prepend A
                            </button>
                            <span className="text-2xl text-white">{text}</span>
                            <button 
                                onClick={() => append("Z")}
                                className="px-4 py-2 bg-white text-primary rounded hover:bg-gray-100"
                            >
                                Append Z
                            </button>
                            <button 
                                onClick={clear}
                                className="px-4 py-2 bg-white text-primary rounded hover:bg-gray-100"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-subheading mb-4">Colors</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-primary text-white ">Primary Color</div>
                        <div className="p-4 bg-secondary text-white">Secondary Color</div>
                        <div className="p-4 bg-accent text-white">Accent Color</div>
                    </div>
                </div>

                <div>
                    <h2 className="text-subheading mb-4">Typography</h2>
                    <div className="space-y-2">
                        <p className="font-primary">Primary Font: Inter</p>
                        <p className="text-heading">Heading Text Size</p>
                        <p className="text-subheading">Subheading Text Size</p>
                    </div>
                </div>

                <div>
                    <h2 className="text-subheading mb-4">Shadows</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-white shadow-primary rounded">Primary Shadow</div>
                        <div className="p-4 bg-white shadow-secondary rounded">Secondary Shadow</div>
                        <div className="p-4 bg-white shadow-accent rounded">Accent Shadow</div>
                    </div>
                </div>

                <div>
                    <h2 className="text-subheading mb-4">Combined Elements</h2>
                    <div className="p-6 bg-primary shadow-primary rounded">
                        <h3 className="text-heading text-white font-primary mb-2">Primary Section</h3>
                        <p className="text-white">Using primary colors and shadows</p>
                    </div>

                    <div className="p-6 bg-secondary shadow-secondary rounded mt-4">
                        <h3 className="text-subheading text-white font-primary mb-2">Secondary Section</h3>
                        <p className="text-white">Using secondary colors and shadows</p>
                    </div>
                </div>
            </section>
        </div>
    )
}