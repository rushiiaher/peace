import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileQuestion, Clock, MoreVertical, Play, Eye } from "lucide-react"
import Link from 'next/link'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface QBCourseCardProps {
    course: any
    onClick: () => void
}

export function QBCourseCard({ course, onClick }: QBCourseCardProps) {
    return (
        <Card
            className="group cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-300 relative overflow-hidden flex flex-col h-full"
            onClick={onClick}
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/50 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex-1">
                <div className="space-y-1">
                    <Badge variant="outline" className="w-fit mb-2 group-hover:bg-primary/5 transition-colors">{course.code}</Badge>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-2">
                        {course.name}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="mt-auto">
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t border-dashed">
                    <FileQuestion className="w-4 h-4 text-primary/70" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">Click to view Question Banks</span>
                </div>
            </CardContent>
        </Card>
    )
}

interface QuestionBankCardProps {
    qb: any
    role: 'super-admin' | 'institute-admin' | 'student'
    onDelete?: (id: string, e: React.MouseEvent) => void
    href?: string
}

export function QuestionBankCard({ qb, role, onDelete, href }: QuestionBankCardProps) {
    const isSuperAdmin = role === 'super-admin'
    const isStudent = role === 'student'
    const isInstituteAdmin = role === 'institute-admin'

    const targetLink = href || (isSuperAdmin ? `/super-admin/question-bank/${qb._id}` :
        isInstituteAdmin ? `/institute-admin/question-bank/${qb._id}` :
            `/student/question-bank/${qb._id}`)

    return (
        <Card className="group hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/40 overflow-hidden flex flex-col h-full bg-card">
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-80 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-3 space-y-3">
                <div className="flex justify-between items-start">
                    <Badge variant="secondary" className="text-xs bg-secondary/50">
                        {qb.questions?.length || 0} Questions
                    </Badge>

                    {isSuperAdmin && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={`/super-admin/question-bank/${qb._id}`} className="cursor-pointer">
                                        Manage Questions
                                    </Link>
                                </DropdownMenuItem>
                                {onDelete && (
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive cursor-pointer bg-destructive/10 focus:bg-destructive/20 mt-1"
                                        onClick={(e) => onDelete(qb._id, e)}
                                    >
                                        Delete
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                <div>
                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
                        {qb.topic}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {new Date(qb.createdAt || Date.now()).toLocaleDateString()}
                    </p>
                </div>
            </CardHeader>

            <CardFooter className="pt-3 border-t bg-muted/5 mt-auto pb-4 px-4">
                <Button asChild size="sm" className={`w-full ${isStudent ? '' : 'bg-background hover:bg-secondary/80 text-foreground border border-input shadow-sm'}`}>
                    <Link href={targetLink}>
                        {isStudent ? (
                            <>
                                <Play className="w-4 h-4 mr-2 fill-current" />
                                Start Practice
                            </>
                        ) : (
                            <>
                                {isSuperAdmin ? null : <Eye className="w-3 h-3 mr-2" />}
                                {isSuperAdmin ? "View Details" : "Review Questions"}
                            </>
                        )}
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
